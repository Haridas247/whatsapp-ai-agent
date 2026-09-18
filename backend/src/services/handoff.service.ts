import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';

export class HandoffService {
  /**
   * Escalates a conversation to human agent takeover
   */
  public async escalateToHuman(
    conversationId: string,
    customerPhone: string,
    reason: string,
    customNotice?: string
  ): Promise<void> {
    // Update conversation status in database
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'HUMAN_HANDOFF',
        state_step: 'HUMAN_HANDOFF',
        state_data: {
          handoffReason: reason,
          escalatedAt: new Date().toISOString(),
        },
      },
    });

    const noticeText =
      customNotice ||
      `👤 *Human Staff Handoff*\n\n` +
      `I have paused automated replies and notified our reception desk team. A staff member will assist you here shortly!\n\n` +
      `Reason: ${reason}`;

    // Record system notification message
    await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender: 'ASSISTANT',
        message: noticeText,
        message_type: 'handoff_alert',
      },
    });

    // Send WhatsApp notification to user
    await whatsappService.sendTextMessage(customerPhone, noticeText);
  }

  /**
   * Resolves or returns conversation back to automated AI bot
   */
  public async returnToBot(conversationId: string, customerPhone?: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'BOT',
        state_step: 'START',
      },
    });

    if (customerPhone) {
      await whatsappService.sendTextMessage(
        customerPhone,
        `🤖 *AI Assistant Reconnected*\n\n` +
        `Our automated assistant is now active again. How can I help you?`
      );
    }
  }
}

export const handoffService = new HandoffService();
