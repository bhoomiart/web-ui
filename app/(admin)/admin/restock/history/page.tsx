export const instant = false;
/**
 * /admin/restock/history — Restock notification history (A4-T6-5)
 *
 * Shows all restock_notification_history rows, most recent first.
 */

import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { listNotificationHistory } from '@/lib/db/restock';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    sent: { label: 'Sent', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    failed: { label: 'Failed', color: 'var(--color-error)', bg: 'var(--color-error-light)' },
  };
  const cfg = map[status] ?? {
    label: status,
    color: 'var(--color-earth-500)',
    bg: 'var(--color-earth-100)',
  };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

export default async function RestockHistoryPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Notification History"
        description="A log of every restock notification dispatched to subscribers."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Restock Subscribers', href: '/admin/restock/subscribers' },
          { label: 'Notification History' },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading history..." />
          </div>
        }
      >
        <HistoryContent />
      </Suspense>
    </div>
  );
}

async function HistoryContent() {
  await requireStaff();

  const { history, total } = await listNotificationHistory({ limit: 100 });

  if (history.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-[var(--font-size-sm)]">No notifications sent yet.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
        {total} notification{total !== 1 ? 's' : ''} recorded
      </p>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[var(--font-size-sm)]">
          <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
            <tr>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Date
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Product
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Contact
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                Channel
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {history.map((h) => {
              const sub = h.restock_subscriptions;
              return (
                <tr key={h.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] whitespace-nowrap">
                    {formatDate(h.attempt_at)}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                    {sub?.products?.name ?? '—'}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-700)]">
                    <div>{sub?.phone ?? '—'}</div>
                    {sub?.email && (
                      <div className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                        {sub.email}
                      </div>
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell capitalize">
                    {sub?.channel ?? '—'}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {statusBadge(h.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
