/**
 * lib/communications/whatsapp-click.ts (A7-T4-2)
 *
 * WhatsApp Click-to-Chat provider.
 *
 * This is a "manual dispatch" provider: it generates a wa.me Click-to-Chat
 * URL and returns it as `actionUrl`. The admin must open the URL manually
 * to send the message. The system does not mark a notification as "sent"
 * automatically — the admin confirms it via the UI.
 *
 * This deliberately distinguishes "Open WhatsApp" from "Message confirmed sent"
 * as required by A7-T3-12.
 */

import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { CommunicationsProvider, NotificationPayload, NotificationResult } from './index';

export const whatsappClickProvider: CommunicationsProvider = {
  name: 'whatsapp-click',
  channels: ['whatsapp'],

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (payload.channel !== 'whatsapp') {
      return {
        success: false,
        providerResponse: 'whatsapp-click only supports the whatsapp channel',
      };
    }

    const actionUrl = buildWhatsAppUrl(payload.recipient, payload.message);

    // Click-to-Chat does not send automatically — return the URL for the admin
    return {
      success: true,
      providerResponse: 'WhatsApp Click-to-Chat URL generated. Open the URL to send manually.',
      actionUrl,
    };
  },
};
