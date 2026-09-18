import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ragService } from '../services/rag.service';
import { whatsappService } from '../services/whatsapp.service';
import { handoffService } from '../services/handoff.service';
import { webhookController } from './webhook.controller';
import { startOfDay, endOfDay } from 'date-fns';

export class ApiController {
  /**
   * Helper to get active business from JWT
   */
  private async getBusiness(req: any) {
    if (!req.user || !req.user.businessId) {
      throw new Error('Unauthorized');
    }
    const biz = await prisma.business.findUnique({ where: { id: req.user.businessId } });
    if (!biz) throw new Error('Business not found');
    return biz;
  }

  /**
   * GET /api/dashboard/stats
   */
  public async getDashboardStats(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      const [
        totalConversations,
        escalations,
        todayAppointments,
        confirmedAppointments,
        recentAppointments,
        servicesCount,
      ] = await Promise.all([
        prisma.conversation.count({ where: { business_id: biz.id } }),
        prisma.conversation.count({ where: { business_id: biz.id, status: 'HUMAN_HANDOFF' } }),
        prisma.appointment.count({
          where: {
            business_id: biz.id,
            start_at: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.appointment.count({
          where: { business_id: biz.id, status: 'CONFIRMED' },
        }),
        prisma.appointment.findMany({
          where: { business_id: biz.id },
          include: { customer: true, service: true, staff: true },
          orderBy: { start_at: 'desc' },
          take: 5,
        }),
        prisma.service.count({ where: { business_id: biz.id } }),
      ]);

      const botResolvedCount = Math.max(0, totalConversations - escalations);
      const aiResolutionRate =
        totalConversations > 0 ? Math.round((botResolvedCount / totalConversations) * 100) : 100;

      res.json({
        business: {
          id: biz.id,
          name: biz.name,
          category: biz.category,
          phone: biz.phone,
          address: biz.address,
          chat_limit: biz.chat_limit,
          chat_count: biz.chat_count,
        },
        metrics: {
          totalConversations,
          todayAppointments,
          confirmedAppointments,
          escalations,
          aiResolutionRate,
          servicesCount,
        },
        recentAppointments,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/appointments
   */
  public async getAppointments(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const { status, date } = req.query;

      const whereClause: any = { business_id: biz.id };
      if (status && typeof status === 'string') {
        whereClause.status = status;
      }
      if (date && typeof date === 'string') {
        const d = new Date(date);
        whereClause.start_at = {
          gte: startOfDay(d),
          lte: endOfDay(d),
        };
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          customer: true,
          service: true,
          staff: true,
        },
        orderBy: { start_at: 'asc' },
      });

      res.json(appointments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * PATCH /api/appointments/:id/status
   */
  public async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { customer: true },
      });

      res.json(appointment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/conversations
   */
  public async getConversations(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const { status } = req.query;
      const whereClause: any = { business_id: biz.id };
      if (status && typeof status === 'string') {
        whereClause.status = status;
      }

      const conversations = await prisma.conversation.findMany({
        where: whereClause,
        include: {
          customer: true,
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { updated_at: 'desc' },
      });

      res.json(conversations);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/conversations/:id/messages
   */
  public async getConversationMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const messages = await prisma.message.findMany({
        where: { conversation_id: id },
        orderBy: { created_at: 'asc' },
      });

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { customer: true },
      });

      res.json({ conversation, messages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/conversations/:id/messages (Human agent sends reply)
   */
  public async sendAgentMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text message is required' });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

      // Save message in DB
      const message = await prisma.message.create({
        data: {
          conversation_id: id,
          sender: 'HUMAN',
          message: text,
          message_type: 'text',
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id },
        data: { updated_at: new Date() },
      });

      // Dispatch to WhatsApp
      await whatsappService.sendTextMessage(conversation.customer.phone, text);

      res.json(message);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/conversations/:id/takeover (Toggle Bot vs Human Handoff)
   */
  public async toggleHandoff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'TAKEOVER' | 'RETURN_TO_BOT'

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

      if (action === 'TAKEOVER') {
        await handoffService.escalateToHuman(
          id,
          conversation.customer.phone,
          'Manual human agent takeover from dashboard'
        );
      } else {
        await handoffService.returnToBot(id, conversation.customer.phone);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/conversations/:id
   */
  public async deleteConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.message.deleteMany({ where: { conversation_id: id } });
      await prisma.conversation.delete({ where: { id } });
      res.json({ success: true, message: 'Conversation deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/conversations
   */
  public async clearAllConversations(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });
      await prisma.message.deleteMany({
        where: { conversation: { business_id: biz.id } },
      });
      await prisma.conversation.deleteMany({
        where: { business_id: biz.id },
      });
      res.json({ success: true, message: 'All conversations cleared' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/knowledge
   */
  public async getKnowledge(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const documents = await prisma.knowledgeDocument.findMany({
        where: { business_id: biz.id },
        include: {
          _count: {
            select: { chunks: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      res.json(documents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/knowledge
   */
  public async createKnowledgeDocument(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const doc = await prisma.knowledgeDocument.create({
        data: {
          business_id: biz.id,
          title,
          content,
          status: 'ACTIVE',
        },
      });

      // Index and create vector embeddings
      const chunkCount = await ragService.indexDocument(doc.id, biz.id, content);

      res.status(201).json({ document: doc, indexedChunks: chunkCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/knowledge/upload-pdf
   * Accepts base64 encoded PDF or file buffer, extracts text and chunks it into pgvector
   */
  public async uploadPdfKnowledge(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const { title, base64Pdf, filename } = req.body;
      if (!base64Pdf) {
        return res.status(400).json({ error: 'base64Pdf data is required' });
      }

      // Convert base64 to buffer
      const cleanBase64 = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      const extractedText = (pdfData.text || '').trim();

      if (!extractedText || extractedText.length < 20) {
        return res.status(400).json({ error: 'Unable to extract text from PDF (it might be scanned images or empty)' });
      }

      const docTitle = title || filename?.replace(/\.pdf$/i, '') || 'Uploaded PDF Document';

      const doc = await prisma.knowledgeDocument.create({
        data: {
          business_id: biz.id,
          title: docTitle,
          content: extractedText,
          status: 'ACTIVE',
        },
      });

      const chunkCount = await ragService.indexDocument(doc.id, biz.id, extractedText);

      res.status(201).json({
        document: doc,
        extractedPages: pdfData.numpages,
        extractedLength: extractedText.length,
        indexedChunks: chunkCount,
      });
    } catch (err: any) {
      console.error('[API uploadPdfKnowledge error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/knowledge/:id/reindex
   */
  public async reindexKnowledgeDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      const chunkCount = await ragService.indexDocument(doc.id, doc.business_id, doc.content);
      res.json({ success: true, indexedChunks: chunkCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/knowledge/:id
   */
  public async deleteKnowledgeDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.knowledgeDocument.delete({ where: { id } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/services
   */
  public async getServices(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const services = await prisma.service.findMany({
        where: { business_id: biz.id },
        orderBy: { price: 'asc' },
      });

      res.json(services);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/services
   */
  public async createOrUpdateService(req: Request, res: Response) {
    try {
      const biz = await this.getBusiness(req);
      if (!biz) return res.status(404).json({ error: 'Business not found' });

      const { id, name, duration_minutes, price, status } = req.body;

      if (id) {
        const updated = await prisma.service.update({
          where: { id },
          data: { name, duration_minutes: Number(duration_minutes), price: Number(price), status },
        });
        return res.json(updated);
      }

      const created = await prisma.service.create({
        data: {
          business_id: biz.id,
          name,
          duration_minutes: Number(duration_minutes || 30),
          price: Number(price || 500),
          status: status || 'ACTIVE',
        },
      });

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/business
   */
  public async getBusinessProfile(req: Request, res: Response) {
    try {
      const biz = await prisma.business.findFirst({
        where: { id: (req as any).user.businessId },
        include: { staff: true },
      });
      res.json(biz);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/simulator/inbound
   * Simulates an incoming customer WhatsApp message for live testing
   */
  public async simulateInbound(req: Request, res: Response) {
    try {
      const { phone = '919876543210', name = 'Rahul', text, buttonId } = req.body;

      if (!text && !buttonId) {
        return res.status(400).json({ error: 'Text or buttonId is required' });
      }

      // Delegate to webhook processing logic via simulated Meta payload
      const mockPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '2301864470568501',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1335214009670704',
                    phone_number_id: '1335214009670704',
                  },
                  contacts: [
                    {
                      profile: { name },
                      wa_id: phone,
                    },
                  ],
                  messages: [
                    buttonId
                      ? {
                          from: phone,
                          id: `sim_msg_${Date.now()}`,
                          timestamp: `${Math.floor(Date.now() / 1000)}`,
                          type: 'interactive',
                          interactive: {
                            type: 'button_reply',
                            button_reply: { id: buttonId, title: text || buttonId },
                          },
                        }
                      : {
                          from: phone,
                          id: `sim_msg_${Date.now()}`,
                          timestamp: `${Math.floor(Date.now() / 1000)}`,
                          type: 'text',
                          text: { body: text },
                        },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const mockReq: any = { body: mockPayload };
      const mockRes: any = {
        status: () => mockRes,
        json: () => mockRes,
        send: () => mockRes,
      };

      // Invoke webhookController
      await webhookController.handleInbound(mockReq, mockRes);

      // Fetch the conversation and latest assistant reply
      const biz = await this.getBusiness(req);
      const cust = await prisma.customer.findFirst({ where: { business_id: biz?.id, phone } });
      const conv = await prisma.conversation.findFirst({
        where: { business_id: biz?.id, customer_id: cust?.id },
        orderBy: { updated_at: 'desc' },
      });
      const latestMessages = await prisma.message.findMany({
        where: { conversation_id: conv?.id },
        orderBy: { created_at: 'desc' },
        take: 5,
      });

      const assistantMsg = latestMessages.find((m) => m.sender === 'ASSISTANT');

      res.json({
        success: true,
        conversationId: conv?.id,
        conversationStatus: conv?.status,
        stateStep: conv?.state_step,
        assistantReply: assistantMsg?.message,
        messages: latestMessages.reverse(),
      });
    } catch (err: any) {
      console.error('[Simulator API Error]', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/businesses
   * List all registered business tenants
   */
  public async getBusinesses(req: Request, res: Response) {
    try {
      const businesses = await prisma.business.findMany({
        include: {
          staff: true,
          _count: {
            select: {
              services: true,
              appointments: true,
              conversations: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      });
      res.json(businesses);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/business/switch-active
   * Switch the active demo business tenant
   */
  public async switchActiveBusiness(req: Request, res: Response) {
    try {
      const { business_id } = req.body;
      if (!business_id) {
        return res.status(400).json({ error: 'business_id is required' });
      }

      // Deactivate all businesses
      await prisma.business.updateMany({
        data: { status: 'INACTIVE' },
      });

      // Activate the selected business
      const activeBiz = await prisma.business.update({
        where: { id: business_id },
        data: { status: 'ACTIVE' },
        include: { staff: true },
      });

      console.log(`[Multi-Tenant] Active business switched to: ${activeBiz.name} (${activeBiz.category})`);
      res.json({ success: true, activeBusiness: activeBiz });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const apiController = new ApiController();
