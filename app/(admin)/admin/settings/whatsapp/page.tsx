export const instant = false;
/**
 * /admin/settings/whatsapp — WhatsApp template settings (A7-T3-11)
 *
 * Displays all WhatsApp message templates stored in site_settings
 * and lets admins edit them. Keys follow the pattern:
 *   whatsapp_template_<name>
 *
 * Falls back to the default templates from lib/whatsapp.ts when no
 * custom value is set in site_settings.
 */

import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { createAdminClient } from '@/lib/supabase/admin';
import { WhatsAppTemplateEditor } from './WhatsAppTemplateEditor';

// Template definitions — key suffix + display metadata
export const TEMPLATE_DEFS = [
  {
    key: 'whatsapp_template_order_acknowledgement',
    label: 'Order Acknowledgement',
    description: 'Sent to customers after they place an order.',
    variables: ['{customerName}', '{orderNumber}'],
    defaultValue:
      "Hi {customerName}! 🏺\n\nThank you for your order from Bhoomi Art.\nOrder number: *{orderNumber}*\n\nWe've received your order and will confirm it shortly.",
  },
  {
    key: 'whatsapp_template_order_confirmed',
    label: 'Order Confirmed',
    description: 'Sent when the admin confirms an order.',
    variables: ['{customerName}', '{orderNumber}'],
    defaultValue:
      "Hi {customerName}! ✅\n\nYour Bhoomi Art order *{orderNumber}* is confirmed.\n\nWe'll begin preparing your pieces and keep you updated. Thank you! 🏺",
  },
  {
    key: 'whatsapp_template_shipped',
    label: 'Order Shipped',
    description: 'Sent when the order is dispatched.',
    variables: ['{customerName}', '{orderNumber}'],
    defaultValue:
      'Hi {customerName}! 📦\n\nYour Bhoomi Art order *{orderNumber}* has been shipped and is on its way to you!\n\nExpect delivery in 3–7 business days.',
  },
  {
    key: 'whatsapp_template_delivered',
    label: 'Order Delivered',
    description: 'Sent after delivery confirmation.',
    variables: ['{customerName}', '{orderNumber}'],
    defaultValue:
      'Hi {customerName}! 🏺✨\n\nYour Bhoomi Art order *{orderNumber}* has been delivered!\n\nWe hope you love it. Please do leave us a review — it means the world to us. Thank you!',
  },
  {
    key: 'whatsapp_template_cancelled',
    label: 'Order Cancelled',
    description: 'Sent when an order is cancelled.',
    variables: ['{customerName}', '{orderNumber}'],
    defaultValue:
      "Hi {customerName},\n\nYour Bhoomi Art order *{orderNumber}* has been cancelled.\n\nIf you have any questions, please reach out. We're sorry for any inconvenience.",
  },
  {
    key: 'whatsapp_template_restock',
    label: 'Restock Notification',
    description: 'Sent to customers on the waitlist when a product is back in stock.',
    variables: ['{productName}', '{storeUrl}'],
    defaultValue:
      'Hi! 🏺\n\nGreat news — *{productName}* is back in stock at Bhoomi Art!\n\nShop now: {storeUrl}\n\nThank you for your patience!',
  },
];

export default async function WhatsAppSettingsPage() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="WhatsApp Templates"
        description="Customise the message templates used for customer notifications."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'WhatsApp Templates' },
        ]}
      />

      <div
        className="mb-[var(--spacing-5)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-info-light)] text-[var(--font-size-sm)]"
        style={{ color: 'var(--color-info)' }}
      >
        <strong>How templates work:</strong> Use variables like <code>{'{customerName}'}</code> and{' '}
        <code>{'{orderNumber}'}</code> — they are replaced with real values when a message is sent.
        Leave blank to use the default template.
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading templates..." />
          </div>
        }
      >
        <TemplateEditorContent />
      </Suspense>
    </div>
  );
}

async function TemplateEditorContent() {
  await requireAdmin();

  const admin = createAdminClient();
  const templateKeys = TEMPLATE_DEFS.map((t) => t.key);
  const { data } = await admin.from('site_settings').select('key, value').in('key', templateKeys);

  const savedValues: Record<string, string> = {};
  for (const row of data ?? []) {
    savedValues[row.key] = row.value;
  }

  return <WhatsAppTemplateEditor templates={TEMPLATE_DEFS} savedValues={savedValues} />;
}
