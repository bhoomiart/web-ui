/**
 * lib/communications/whatsapp-api-stub.ts (A7-T4-3)
 *
 * Placeholder for a future WhatsApp Business API integration.
 *
 * When the Business API is set up:
 * 1. Replace this stub with a real implementation
 * 2. Register it in lib/communications/index.ts as the 'whatsapp' provider
 *    (or as an alternative when WHATSAPP_API_TOKEN is set)
 * 3. The interface is already defined — no other files need to change
 */

import type { CommunicationsProvider, NotificationPayload, NotificationResult } from './index';

export const whatsappApiProvider: CommunicationsProvider = {
  name: 'whatsapp-api',
  channels: ['whatsapp'],

  async sendNotification(_payload: NotificationPayload): Promise<NotificationResult> {
    // TODO: implement WhatsApp Business API call here
    // Example libraries: @whiskeysockets/baileys, twilio, official Cloud API
    throw new Error(
      'WhatsApp Business API is not yet configured. ' +
        'Set WHATSAPP_API_TOKEN and implement this stub.'
    );
  },
};
