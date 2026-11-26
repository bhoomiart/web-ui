/**
 * lib/communications/email-stub.ts (A7-T4-4)
 *
 * Placeholder for a future transactional email integration.
 *
 * When email is set up:
 * 1. Install a provider SDK (Resend, SendGrid, AWS SES, etc.)
 * 2. Replace this stub with a real implementation
 * 3. Register it in lib/communications/index.ts for the 'email' channel
 */

import type { CommunicationsProvider, NotificationPayload, NotificationResult } from './index';

export const emailProvider: CommunicationsProvider = {
  name: 'email',
  channels: ['email'],

  async sendNotification(_payload: NotificationPayload): Promise<NotificationResult> {
    // TODO: implement transactional email here
    // Suggested providers: Resend (https://resend.com), SendGrid, AWS SES
    throw new Error(
      'Transactional email is not yet configured. ' + 'Set EMAIL_API_KEY and implement this stub.'
    );
  },
};
