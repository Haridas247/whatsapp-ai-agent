import axios from 'axios';
import { config } from '../config/env';

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface InboundWhatsAppMessage {
  from: string;
  name: string;
  messageId: string;
  type: 'text' | 'interactive_button' | 'interactive_list' | 'audio' | 'unknown';
  text: string;
  buttonId?: string;
  audioId?: string;
  mimeType?: string;
  timestamp: string;
}

class WhatsAppService {
  private processedMessageIds = new Set<string>();

  /**
   * Checks if message has already been processed to prevent duplicates (idempotency)
   */
  public isDuplicateMessage(messageId: string): boolean {
    if (this.processedMessageIds.has(messageId)) {
      return true;
    }
    this.processedMessageIds.add(messageId);
    // Keep set bounded (max 5000 IDs)
    if (this.processedMessageIds.size > 5000) {
      const first = this.processedMessageIds.values().next().value;
      if (first) this.processedMessageIds.delete(first);
    }
    return false;
  }

  /**
   * Verifies Webhook Token challenge from Meta
   */
  public verifyWebhookChallenge(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined
  ): string | null {
    if (mode === 'subscribe' && token === config.WHATSAPP_VERIFY_TOKEN) {
      return challenge || null;
    }
    return null;
  }

  /**
   * Parses and normalizes incoming Meta WhatsApp Cloud webhook payload
   */
  public parseInboundWebhook(body: any): InboundWhatsAppMessage | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (!message) return null;

      const from = message.from; // Phone number e.g. 919876543210
      const contact = change?.contacts?.[0];
      const name = contact?.profile?.name || 'Customer';
      const messageId = message.id;
      const timestamp = message.timestamp;

      if (message.type === 'text') {
        return {
          from,
          name,
          messageId,
          type: 'text',
          text: message.text?.body?.trim() || '',
          timestamp,
        };
      }

      if (message.type === 'interactive') {
        const interactive = message.interactive;
        if (interactive?.type === 'button_reply') {
          return {
            from,
            name,
            messageId,
            type: 'interactive_button',
            text: interactive.button_reply?.title || '',
            buttonId: interactive.button_reply?.id,
            timestamp,
          };
        }
        if (interactive?.type === 'list_reply') {
          return {
            from,
            name,
            messageId,
            type: 'interactive_list',
            text: interactive.list_reply?.title || '',
            buttonId: interactive.list_reply?.id,
            timestamp,
          };
        }
      }

      if (message.type === 'audio') {
        return {
          from,
          name,
          messageId,
          type: 'audio',
          text: '[Voice Note]',
          audioId: message.audio?.id,
          mimeType: message.audio?.mime_type,
          timestamp,
        };
      }

      return {
        from,
        name,
        messageId,
        type: 'unknown',
        text: message.text?.body || '',
        timestamp,
      };
    } catch (error) {
      console.error('[WhatsAppService] Error parsing webhook payload:', error);
      return null;
    }
  }

  /**
   * Sends an outbound text message via Meta Graph API v21.0
   */
  public async sendTextMessage(to: string, text: string): Promise<boolean> {
    const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    return this.dispatchMetaRequest(url, payload);
  }

  /**
   * Sends interactive reply buttons (up to 3 buttons supported by WhatsApp)
   */
  public async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    headerText?: string
  ): Promise<boolean> {
    const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // WhatsApp supports maximum 3 quick reply buttons
    const formattedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title.slice(0, 20), // 20 char limit in WhatsApp API
      },
    }));

    const interactivePayload: any = {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: formattedButtons,
      },
    };

    if (headerText) {
      interactivePayload.header = {
        type: 'text',
        text: headerText,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'interactive',
      interactive: interactivePayload,
    };

    return this.dispatchMetaRequest(url, payload);
  }

  /**
   * Sends interactive list message (for service or slot selection with up to 10 rows)
   */
  public async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: WhatsAppListSection[],
    headerText?: string
  ): Promise<boolean> {
    const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const interactivePayload: any = {
      type: 'list',
      body: {
        text: bodyText,
      },
      action: {
        button: buttonText.slice(0, 20),
        sections: sections.map((sec) => ({
          title: sec.title.slice(0, 24),
          rows: sec.rows.slice(0, 10).map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            description: r.description ? r.description.slice(0, 72) : undefined,
          })),
        })),
      },
    };

    if (headerText) {
      interactivePayload.header = {
        type: 'text',
        text: headerText,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'interactive',
      interactive: interactivePayload,
    };

    return this.dispatchMetaRequest(url, payload);
  }

  /**
   * Marks an incoming WhatsApp message as read (instant double blue ticks)
   * AND broadcasts real-time "typing..." presence to WhatsApp (Meta Cloud API)
   */
  public async sendTypingIndicator(messageId: string): Promise<boolean> {
    if (!messageId || messageId.startsWith('sim_')) return false;

    const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: {
        type: 'text',
      },
    };

    return this.dispatchMetaRequest(url, payload);
  }

  /**
   * Backward-compatible helper to mark message as read and show typing indicator
   */
  public async markMessageAsRead(messageId: string): Promise<boolean> {
    return this.sendTypingIndicator(messageId);
  }

  /**
   * Internal helper to dispatch authenticated request to Meta Graph API
   */
  private async dispatchMetaRequest(url: string, payload: any): Promise<boolean> {
    if (!config.WHATSAPP_ACCESS_TOKEN || !config.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('[WhatsAppService] WhatsApp credentials missing. Outbound message logged only.');
      return false;
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return response.status === 200 || response.status === 201;
    } catch (error: any) {
      console.error(
        '[WhatsAppService] Failed to send WhatsApp message:',
        error.response?.data || error.message
      );
      return false;
    }
  }

  /**
   * Downloads media from WhatsApp Servers (e.g., Audio Notes)
   * Returns a Buffer containing the media binary data.
   */
  public async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!config.WHATSAPP_ACCESS_TOKEN) return null;

    try {
      // 1. Get media URL
      const urlResponse = await axios.get(`https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${mediaId}`, {
        headers: {
          Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
        },
      });

      const mediaUrl = urlResponse.data?.url;
      const mimeType = urlResponse.data?.mime_type || 'audio/ogg';

      if (!mediaUrl) return null;

      // 2. Download binary data
      const mediaResponse = await axios.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
        },
        responseType: 'arraybuffer',
      });

      return {
        buffer: Buffer.from(mediaResponse.data),
        mimeType,
      };
    } catch (error: any) {
      console.error('[WhatsAppService] Error downloading media:', error.message);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
