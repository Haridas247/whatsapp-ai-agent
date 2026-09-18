import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { whatsappService } from '../services/whatsapp.service';
import { geminiService } from '../services/gemini.service';
import { ragService } from '../services/rag.service';
import { bookingService } from '../services/booking.service';
import { handoffService } from '../services/handoff.service';
import { emailService } from '../services/email.service';

export class WebhookController {
  /**
   * Meta Webhook verification handshake
   * GET /api/webhooks/whatsapp
   */
  public verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = whatsappService.verifyWebhookChallenge(mode, token, challenge);

    if (verifiedChallenge) {
      console.log('[Webhook] Challenge successfully verified by Meta');
      return res.status(200).send(verifiedChallenge);
    }

    console.warn('[Webhook] Verification failed: token mismatch');
    return res.status(403).send('Verification failed');
  }

  /**
   * Inbound WhatsApp Webhook event handler
   * POST /api/webhooks/whatsapp
   */
  public async handleInbound(req: Request, res: Response) {
    console.log('[Webhook INBOUND POST Received]:', JSON.stringify(req.body));
    // Immediately acknowledge HTTP 200 to Meta to avoid re-delivery retries
    res.status(200).json({ status: 'received' });

    try {
      const parsed = whatsappService.parseInboundWebhook(req.body);
      if (!parsed || !parsed.from) {
        console.log('[Webhook] Parsed payload had no message or from field.');
        return;
      }

      // Check deduplication
      if (whatsappService.isDuplicateMessage(parsed.messageId)) {
        console.log(`[Webhook] Duplicate message ${parsed.messageId} skipped.`);
        return;
      }

      const startTime = Date.now();

      // Trigger instant read-receipt & real-time typing indicator ("typing...") to WhatsApp
      let typingPromise: Promise<boolean> = Promise.resolve(false);
      if (parsed.messageId) {
        typingPromise = whatsappService.sendTypingIndicator(parsed.messageId).catch((err: any) => {
          console.warn('[Webhook] Failed to send typing indicator:', err?.message);
          return false;
        });
      }

      const sendWhatsAppReply = async (dispatch: () => Promise<boolean>) => {
        try {
          await typingPromise;
          const elapsed = Date.now() - startTime;
          const minDuration = 1200; // Allow typing indicator to display prominently on WhatsApp
          if (elapsed < minDuration) {
            await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
          }
        } catch (e) {
          // ignore delay error
        }
        return dispatch();
      };

      const customerPhone = parsed.from;
      const customerName = parsed.name || 'Customer';

      // 1. Resolve Active Business Tenant
      const business = await prisma.business.findFirst({
        where: { status: 'ACTIVE' },
      });

      if (!business) {
        console.error('[Webhook] No active business tenant found in database.');
        return;
      }

      const businessId = business.id;

      if (business.chat_count >= business.chat_limit) {
        console.warn(`[Webhook] Business ${businessId} has reached chat limit (${business.chat_limit}).`);
        const fallbackMsg = `⚠️ Our AI assistant is currently unavailable for ${business.name}. Please contact the clinic directly via phone.`;
        await whatsappService.sendTextMessage(customerPhone, fallbackMsg);
        
        // Notify admin if exactly reached
        if (business.chat_count === business.chat_limit) {
           const firstUser = await prisma.user.findFirst({ where: { business_id: businessId, role: 'ADMIN' } });
           if (firstUser) {
             await emailService.sendLimitReachedNotification(firstUser.email, business.name, business.chat_limit);
           }
        }
        
        // Still increment so we don't send emails repeatedly if we only send on exact match, or we just don't increment.
        return;
      }

      // 2. Resolve Customer strictly scoped to active Business Tenant
      let customer = await prisma.customer.findFirst({
        where: { business_id: businessId, phone: customerPhone },
        include: {
          conversations: {
            where: { business_id: businessId },
            orderBy: { updated_at: 'desc' },
            take: 1,
          },
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            business_id: businessId,
            phone: customerPhone,
            name: customerName,
            metadata: { source: 'whatsapp_inbound' },
          },
          include: {
            conversations: {
              where: { business_id: businessId },
              orderBy: { updated_at: 'desc' },
              take: 1,
            },
          },
        });
      }

      // 3. Resolve active conversation for this business tenant
      let conversation = customer.conversations?.[0];
      if (!conversation || conversation.status === 'RESOLVED') {
        conversation = await prisma.conversation.create({
          data: {
            business_id: businessId,
            customer_id: customer.id,
            status: 'BOT',
            state_step: 'START',
            state_data: {},
          },
        });
      }

      // 4. Parallelize recording inbound message and fetching recent history for intent analysis
      const [customerMsg, recentMessages] = await Promise.all([
        prisma.message.create({
          data: {
            conversation_id: conversation.id,
            sender: 'CUSTOMER',
            message: parsed.text || parsed.buttonId || '[Media/Interactive]',
            message_type: parsed.type,
            metadata: {
              messageId: parsed.messageId,
              buttonId: parsed.buttonId,
              audioId: parsed.audioId,
            },
          },
        }),
        prisma.message.findMany({
          where: { conversation_id: conversation.id },
          orderBy: { created_at: 'desc' },
          take: 6,
        }),
      ]);

      // 5. Check if Bot is muted for Human Handoff
      if (conversation.status === 'HUMAN_HANDOFF') {
        console.log(`[Webhook] Conversation ${conversation.id} is in HUMAN_HANDOFF. Bot response suppressed.`);
        return;
      }

      // 6. Medical Emergency Guardrail - ALWAYS evaluated first!
      if (geminiService.isEmergencyText(parsed.text)) {
        const emergencyAlert = geminiService.getEmergencyMessage(business.phone);
        await handoffService.escalateToHuman(
          conversation.id,
          customerPhone,
          'Critical Medical Emergency Detected',
          emergencyAlert
        );
        return;
      }

      // 7. Intent analysis with Gemini
      const history = recentMessages.reverse().map((m) => ({
        role: m.sender === 'CUSTOMER' ? ('user' as const) : ('assistant' as const),
        content: m.message,
      }));

      let userText = parsed.text;
      let analysis;

      if (parsed.type === 'audio' && parsed.audioId) {
        console.log(`[Webhook] Audio message received. Downloading mediaId: ${parsed.audioId}`);
        const media = await whatsappService.downloadMedia(parsed.audioId);
        
        if (media) {
           const result = await geminiService.transcribeAudioAndAnalyzeIntent(media.buffer, media.mimeType, history);
           userText = `[Transcribed Voice Note]: ${result.transcribedText}`;
           analysis = result.analysis;
           console.log(`[Webhook] Transcribed Audio: "${userText}"`);
           
           // Update the message in DB with transcription
           await prisma.message.update({
             where: { id: customerMsg.id },
             data: { message: userText }
           });
        } else {
           userText = "[Voice Note Unreadable - Failed to Download]";
           analysis = { intent: 'FAQ', language: 'en', isEmergency: false } as any;
        }
      } else {
        analysis = await geminiService.analyzeIntent(userText, history);
      }

      if (analysis.isEmergency || analysis.intent === 'EMERGENCY') {
        const emergencyAlert = geminiService.getEmergencyMessage(business.phone);
        await handoffService.escalateToHuman(
          conversation.id,
          customerPhone,
          analysis.emergencyReason || 'Critical Medical Emergency Detected',
          emergencyAlert
        );
        return;
      }

      if (analysis.intent === 'HUMAN_AGENT') {
        await handoffService.escalateToHuman(
          conversation.id,
          customerPhone,
          'Patient requested human receptionist assistance'
        );
        return;
      }

      // 8. Determine if user is actively performing a booking action
      const lowerText = (userText || '').toLowerCase();
      const hasBookingButton = Boolean(parsed.buttonId);
      const isBookingKeyword = /\b(book|appointment|slot|schedule|confirm|yes|aama|cancel|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(lowerText);
      const isTimeSlot = /^\d{1,2}(:\d{2})?\s*(am|pm)?$/i.test(lowerText.trim());
      const isServiceSelection =
        conversation.state_step === 'SELECT_SERVICE' &&
        (/^\d+$/.test(lowerText.trim()) ||
          lowerText.includes('consult') ||
          lowerText.includes('dental') ||
          lowerText.includes('root') ||
          lowerText.includes('clean') ||
          lowerText.includes('white') ||
          lowerText.includes('fill') ||
          lowerText.includes('hair') ||
          lowerText.includes('cut') ||
          lowerText.includes('spa') ||
          lowerText.includes('facial') ||
          lowerText.includes('beard') ||
          lowerText.includes('shave') ||
          lowerText.includes('pedi') ||
          lowerText.includes('mani') ||
          lowerText.includes('bridal') ||
          lowerText.includes('tan'));

      const isBookingAction =
        hasBookingButton ||
        (conversation.state_step !== 'START' && (isBookingKeyword || isTimeSlot || isServiceSelection));

      const ensureTypingWindow = async (minMs = 2500) => {
        const elapsed = Date.now() - startTime;
        const waitTime = minMs - elapsed;
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      };

      if (isBookingAction) {
        const stateResult = await bookingService.processBookingState(
          businessId,
          conversation.id,
          customerPhone,
          conversation.state_step,
          (conversation.state_data as any) || {},
          userText,
          parsed.buttonId
        );

        // Store assistant response
        await prisma.message.create({
          data: {
            conversation_id: conversation.id,
            sender: 'ASSISTANT',
            message: stateResult.replyText,
            message_type: stateResult.buttons ? 'interactive' : 'text',
          },
        });

        // Ensure user sees "typing..." indicator distinctly before receiving reply
        await ensureTypingWindow(2500);

        if (stateResult.buttons && stateResult.buttons.length > 0) {
          await whatsappService.sendInteractiveButtons(
            customerPhone,
            stateResult.replyText,
            stateResult.buttons
          );
        } else {
          await whatsappService.sendTextMessage(customerPhone, stateResult.replyText);
        }
        await prisma.business.update({ where: { id: businessId }, data: { chat_count: { increment: 1 } } });
        return;
      }

      // 9. Handle Booking Intent
      if (analysis.intent === 'BOOKING') {
        const bookingResult = await bookingService.processBookingState(
          businessId,
          conversation.id,
          customerPhone,
          'START',
          {},
          userText,
          parsed.buttonId
        );

        await prisma.message.create({
          data: {
            conversation_id: conversation.id,
            sender: 'ASSISTANT',
            message: bookingResult.replyText,
            message_type: bookingResult.buttons ? 'interactive' : 'text',
          },
        });

        // Ensure user sees "typing..." indicator distinctly before receiving reply
        await ensureTypingWindow(2500);

        if (bookingResult.buttons && bookingResult.buttons.length > 0) {
          await whatsappService.sendInteractiveButtons(
            customerPhone,
            bookingResult.replyText,
            bookingResult.buttons
          );
        } else {
          await whatsappService.sendTextMessage(customerPhone, bookingResult.replyText);
        }
        await prisma.business.update({ where: { id: businessId }, data: { chat_count: { increment: 1 } } });
        return;
      }

      // 11. Handle FAQ & General Conversational Queries via Multi-Tenant RAG
      const aiReply = await ragService.generateGroundedAnswer({
        businessId,
        businessName: business.name,
        userMessage: userText,
        history,
        languageHint: analysis.language,
      });

      // Record outbound assistant message
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          sender: 'ASSISTANT',
          message: aiReply,
          message_type: 'text',
        },
      });

      // Ensure user sees "typing..." indicator distinctly before receiving reply
      await ensureTypingWindow(2500);

      // Send to WhatsApp
      await whatsappService.sendTextMessage(customerPhone, aiReply);
      await prisma.business.update({ where: { id: businessId }, data: { chat_count: { increment: 1 } } });
    } catch (err: any) {
      console.error('[Webhook] Inbound message processing error:', err);
    }
  }
}

export const webhookController = new WebhookController();
