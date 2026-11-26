/**
 * lib/communications/index.ts (A7-T4-1)
 *
 * Provider interface for the communications layer.
 *
 * Current implementation: WhatsApp Click-to-Chat (manual dispatch by admin).
 * Future: WhatsApp Business API, transactional email, SMS.
 *
 * The interface is intentionally minimal — just enough to route
 * notification intent to the right channel without coupling callers
 * to any specific provider.
 */

export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

export interface NotificationPayload {
  /** Recipient phone (international format, no +) or email address */
  recipient: string;
  channel: NotificationChannel;
  /** Pre-formatted message body */
  message: string;
  /** Optional subject line (used by email providers) */
  subject?: string;
  /** Internal reference (e.g. orderId, subscriptionId) for logging */
  referenceId?: string;
}

export interface NotificationResult {
  success: boolean;
  /** Provider-specific message or error */
  providerResponse?: string;
  /** URL to open (e.g. Click-to-Chat link) — only set for manual-dispatch channels */
  actionUrl?: string;
}

export interface CommunicationsProvider {
  name: string;
  channels: NotificationChannel[];
  /**
   * Send a notification.
   *
   * For Click-to-Chat providers this does not send a message automatically —
   * it returns an `actionUrl` that the admin must open manually.
   * For API-based providers this would call the API directly.
   */
  sendNotification(payload: NotificationPayload): Promise<NotificationResult>;
}

// ─── Active provider selection ────────────────────────────────────────────────

import { whatsappClickProvider } from './whatsapp-click';

/**
 * Returns the active provider for a given channel.
 * Currently only WhatsApp Click-to-Chat is available.
 */
export function getProvider(channel: NotificationChannel): CommunicationsProvider | null {
  switch (channel) {
    case 'whatsapp':
      return whatsappClickProvider;
    default:
      return null;
  }
}

/**
 * Convenience wrapper — send a notification via the appropriate provider.
 * Returns null if no provider is configured for the channel.
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult | null> {
  const provider = getProvider(payload.channel);
  if (!provider) return null;
  return provider.sendNotification(payload);
}
