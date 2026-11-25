export const instant = false;
/**
 * /admin/restock/notifications — Pending restock notifications (A4-T6-2 → A4-T6-5)
 *
 * Shows active subscribers for products that are currently out of stock.
 * Admin opens WhatsApp for each, then clicks "Mark Sent" to record it.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { listPendingNotifications } from '@/lib/db/restock';
import { getInventoryWithProduct } from '@/lib/db/inventory';
import { NotifyActions } from './NotifyActions';

function buildWhatsAppUrl(phone: string, productName: string): string {
  // Strip non-digits, add +91 country code if needed
  const digits = phone.replace(/\D/g, '');
  const formatted = digits.startsWith('91') ? digits : `91${digits}`;
  const message = encodeURIComponent(
    `Hi! Great news — "${productName}" is now back in stock on Bhoomi Art. Click here to shop: https://bhoomiart.com`
  );
  return `https://wa.me/${formatted}?text=${message}`;
}

export default async function PendingNotificationsPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Pending Notifications"
        description="Customers waiting for restock alerts. Open WhatsApp for each, then mark as sent."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Restock Subscribers', href: '/admin/restock/subscribers' },
          { label: 'Pending Notifications' },
        ]}
        action={
          <Link
            href="/admin/restock/history"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
          >
            View History
          </Link>
        }
      />

      <div
        className="mb-[var(--spacing-5)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-info-light)] text-[var(--font-size-sm)]"
        style={{ color: 'var(--color-info)' }}
      >
        <strong>How this works:</strong> Click <em>Open WhatsApp</em> to send the message manually,
        then click <em>Mark Sent</em> to record it. The subscriber status will update to
        &ldquo;Notified&rdquo;.
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading pending notifications..." />
          </div>
        }
      >
        <NotificationsContent />
      </Suspense>
    </div>
  );
}

async function NotificationsContent() {
  await requireStaff();

  const [pending, inventoryRows] = await Promise.all([
    listPendingNotifications(),
    getInventoryWithProduct(),
  ]);

  // Build a map from product_id → inventory_id for the "mark sent" action
  const inventoryByProduct: Record<string, string> = {};
  for (const row of inventoryRows) {
    inventoryByProduct[row.product_id] = row.id;
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
        <svg
          className="w-10 h-10 mb-3 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]">
          No pending notifications — all subscribers have been contacted.
        </p>
        <Link
          href="/admin/restock/history"
          className="mt-3 text-[var(--font-size-sm)] text-[var(--color-brand-primary)] hover:underline font-semibold"
        >
          View notification history →
        </Link>
      </div>
    );
  }

  // Group by product
  const byProduct: Record<string, typeof pending> = {};
  for (const sub of pending) {
    const pid = sub.product_id;
    if (!byProduct[pid]) byProduct[pid] = [];
    byProduct[pid].push(sub);
  }

  return (
    <div className="space-y-[var(--spacing-6)]">
      {Object.entries(byProduct).map(([productId, subs]) => {
        const productName = subs[0]?.products?.name ?? 'Unknown Product';
        const inventoryId = inventoryByProduct[productId];

        return (
          <div
            key={productId}
            className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden"
          >
            {/* Product header */}
            <div className="px-[var(--spacing-5)] py-[var(--spacing-4)] bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)] flex items-center justify-between gap-[var(--spacing-4)]">
              <div>
                <p className="font-semibold text-[var(--color-earth-900)]">{productName}</p>
                <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                  {subs.length} subscriber{subs.length !== 1 ? 's' : ''} waiting
                </p>
              </div>
              <span
                className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold"
                style={{ color: 'var(--color-error)', background: 'var(--color-error-light)' }}
              >
                Out of Stock
              </span>
            </div>

            {/* Subscriber rows */}
            <table className="w-full text-[var(--font-size-sm)]">
              <thead className="border-b border-[var(--color-earth-100)]">
                <tr>
                  <th className="text-left px-[var(--spacing-5)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                    Contact
                  </th>
                  <th className="text-left px-[var(--spacing-5)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                    Channel
                  </th>
                  <th
                    className="px-[var(--spacing-5)] py-[var(--spacing-3)]"
                    aria-label="Actions"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-earth-100)]">
                {subs.map((sub) => {
                  const waUrl = sub.phone ? buildWhatsAppUrl(sub.phone, productName) : null;

                  return (
                    <tr key={sub.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                      <td className="px-[var(--spacing-5)] py-[var(--spacing-3)]">
                        <div className="font-semibold text-[var(--color-earth-800)]">
                          {sub.phone ?? '—'}
                        </div>
                        {sub.email && (
                          <div className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                            {sub.email}
                          </div>
                        )}
                      </td>
                      <td className="px-[var(--spacing-5)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell capitalize">
                        {sub.channel}
                      </td>
                      <td className="px-[var(--spacing-5)] py-[var(--spacing-3)] text-right">
                        <NotifyActions
                          subscriptionId={sub.id}
                          inventoryId={inventoryId ?? ''}
                          whatsAppUrl={waUrl}
                          productName={productName}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
