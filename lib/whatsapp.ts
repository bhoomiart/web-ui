/**
 * lib/whatsapp.ts (A7-T3)
 *
 * WhatsApp Click-to-Chat URL builder and message template library.
 *
 * All templates use the WhatsApp Click-to-Chat URL format:
 *   https://wa.me/<phone>?text=<encoded-message>
 *
 * The phone number stored in NEXT_PUBLIC_WHATSAPP_NUMBER is in
 * international format without + (e.g. 917019400775).
 *
 * UI NOTE (A7-T3-12): Components using these templates should clearly
 * distinguish "Open WhatsApp" (a link that opens the app) from
 * "Message confirmed sent" (a user action after they've actually sent it).
 * Never auto-mark a notification as sent just because the link was opened.
 */

// ─── URL builder ─────────────────────────────────────────────────────────────

/**
 * Formats a local Indian phone number to international format (91XXXXXXXXXX).
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, or 10-digit local numbers.
 */
export function formatPhoneInternational(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits; // already formatted or unknown — return as-is
}

/**
 * Builds a WhatsApp Click-to-Chat URL.
 *
 * @param phone  Recipient phone number (any format; normalised internally)
 * @param message  Pre-filled message text (will be URI-encoded)
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const formatted = formatPhoneInternational(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

/** Convenience: get the admin's WhatsApp number from env */
export function adminPhone(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';
}

// ─── Templates ────────────────────────────────────────────────────────────────
// Each function returns a fully-formed message string.
// Use with buildWhatsAppUrl() to create a Click-to-Chat link.

export const templates = {
  // ── Customer → Admin (new order notification) ─────────────────────────────

  /** A7-T3-2: Customer notifies admin of a new order */
  newOrderToAdmin: (orderNumber: string, customerName: string): string =>
    `Hi! I just placed an order on Bhoomi Art.\n\nOrder: ${orderNumber}\nName: ${customerName}\n\nPlease confirm my order and share payment details. Thank you! 🏺`,

  // ── Admin → Customer (status updates) ─────────────────────────────────────

  /** A7-T3-3: Order acknowledgement to customer */
  orderAcknowledgement: (customerName: string, orderNumber: string): string =>
    `Hi ${customerName}! 🏺\n\nThank you for your order from Bhoomi Art.\nOrder number: *${orderNumber}*\n\nWe've received your order and will confirm it shortly. You'll hear from us with payment details soon.`,

  /** A7-T3-4: Order confirmed + payment details */
  orderConfirmation: (customerName: string, orderNumber: string): string =>
    `Hi ${customerName}! ✅\n\nYour Bhoomi Art order *${orderNumber}* is confirmed.\n\nWe'll begin preparing your pieces and keep you updated at every step. Thank you for choosing Bhoomi Art! 🏺`,

  /** A7-T3-5: Processing / customization update */
  processingUpdate: (customerName: string, orderNumber: string, details?: string): string =>
    `Hi ${customerName}! 🎨\n\nYour Bhoomi Art order *${orderNumber}* is now being prepared.${
      details ? `\n\n${details}` : ''
    }\n\nWe'll notify you when it's ready for dispatch.`,

  /** A7-T3-6: Dispatch and shipping update */
  dispatchUpdate: (customerName: string, orderNumber: string, trackingInfo?: string): string =>
    `Hi ${customerName}! 📦\n\nGreat news — your Bhoomi Art order *${orderNumber}* has been shipped and is on its way to you!${
      trackingInfo ? `\n\nTracking: ${trackingInfo}` : ''
    }\n\nExpect delivery in 3–7 business days. Feel free to reach out if you have any questions.`,

  /** A7-T3-7: Delivery confirmation */
  deliveryConfirmation: (customerName: string, orderNumber: string): string =>
    `Hi ${customerName}! 🏺✨\n\nYour Bhoomi Art order *${orderNumber}* has been delivered!\n\nWe hope you love your piece(s). It would mean the world to us if you shared your experience — feel free to leave a review on our website.\n\nThank you for being part of the Bhoomi Art family! 🌿`,

  /** A7-T3-8: Cancellation update */
  cancellationUpdate: (customerName: string, orderNumber: string, reason?: string): string =>
    `Hi ${customerName},\n\nYour Bhoomi Art order *${orderNumber}* has been cancelled.${
      reason ? `\n\nReason: ${reason}` : ''
    }\n\nIf you have any questions or would like to place a new order, please don't hesitate to reach out. We're sorry for any inconvenience.`,

  /** A7-T3-9: Return / refund update */
  returnRefundUpdate: (
    customerName: string,
    orderNumber: string,
    action: 'return_approved' | 'return_rejected' | 'refund_processed' | 'refund_rejected',
    details?: string
  ): string => {
    const actionMessages: Record<string, string> = {
      return_approved: `Your return request for order *${orderNumber}* has been *approved*. Please send the item(s) back to us and we'll process your refund once received.`,
      return_rejected: `After reviewing your return request for order *${orderNumber}*, we're unfortunately unable to approve it.${details ? ` ${details}` : ''}`,
      refund_processed: `Your refund for order *${orderNumber}* has been processed.${details ? ` ${details}` : ''} It should appear in your account within 3–5 business days.`,
      refund_rejected: `We were unable to process a refund for order *${orderNumber}*.${details ? ` ${details}` : ''}`,
    };
    return `Hi ${customerName},\n\n${actionMessages[action] ?? 'Update regarding your order.'}\n\nPlease reach out if you have any questions.`;
  },

  /** A7-T3-10: Restock notification */
  restockNotification: (productName: string, storeUrl = 'https://bhoomiart.com'): string =>
    `Hi! 🏺\n\nGreat news — *${productName}* is back in stock at Bhoomi Art!\n\nShop now before it sells out again: ${storeUrl}\n\nThank you for your patience. We hope you love it!`,

  // ── Enquiry templates ──────────────────────────────────────────────────────

  /** Product enquiry from product detail page */
  productEnquiry: (productName: string): string =>
    `Hi Bhoomi Art! I'm interested in "${productName}" and would like to know more. Could you help me?`,

  /** Custom creation enquiry */
  customEnquiry: (): string =>
    `Hi Bhoomi Art! I'm interested in a custom creation. Could you tell me more about the process and pricing?`,

  /** General enquiry */
  generalEnquiry: (): string => `Hi Bhoomi Art! I have a question and would love some help.`,
};

// ─── Admin convenience URLs ───────────────────────────────────────────────────

/**
 * Build a WhatsApp URL targeting the Bhoomi Art admin number,
 * for use in storefront CTAs and enquiry buttons.
 */
export function adminWhatsAppUrl(message: string): string {
  return buildWhatsAppUrl(adminPhone(), message);
}

/**
 * Build a WhatsApp URL targeting a customer phone,
 * for use in admin order management.
 */
export function customerWhatsAppUrl(customerPhone: string, message: string): string {
  return buildWhatsAppUrl(customerPhone, message);
}
