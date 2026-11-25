export const instant = false;
/**
 * /admin/restock/subscribers — Restock subscriber management (A4-T6-1)
 *
 * Lists all restock_subscriptions joined with product names.
 * Filter by status (active / notified / unsubscribed).
 * Admin can mark a subscriber as unsubscribed.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { listRestockSubscriptions } from '@/lib/db/restock';
import { SubscriberActions } from './SubscriberActions';

type StatusFilter = 'all' | 'active' | 'notified' | 'unsubscribed';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'notified', label: 'Notified' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    notified: { label: 'Notified', color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    unsubscribed: {
      label: 'Unsubscribed',
      color: 'var(--color-earth-400)',
      bg: 'var(--color-earth-100)',
    },
  };
  const cfg = map[status] ?? {
    label: status,
    color: 'var(--color-earth-400)',
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

function channelLabel(channel: string) {
  return { whatsapp: 'WhatsApp', email: 'Email', both: 'WhatsApp + Email' }[channel] ?? channel;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function RestockSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const { status: rawStatus } = await searchParams;
  const statusFilter = (typeof rawStatus === 'string' ? rawStatus : 'all') as StatusFilter;

  return (
    <div>
      <AdminPageHeader
        title="Restock Subscribers"
        description="Customers waiting to be notified when products come back in stock."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Restock Subscribers' },
        ]}
        action={
          <Link
            href="/admin/restock/notifications"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Pending Notifications
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-[var(--spacing-1)] mb-[var(--spacing-5)] border-b border-[var(--color-earth-100)]">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === statusFilter;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'all'
                  ? '/admin/restock/subscribers'
                  : `/admin/restock/subscribers?status=${tab.key}`
              }
              className={`px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading subscribers..." />
          </div>
        }
      >
        <SubscribersContent statusFilter={statusFilter} />
      </Suspense>
    </div>
  );
}

async function SubscribersContent({ statusFilter }: { statusFilter: StatusFilter }) {
  await requireStaff();

  const { subscriptions, total } = await listRestockSubscriptions({
    status:
      statusFilter !== 'all' ? (statusFilter as 'active' | 'notified' | 'unsubscribed') : undefined,
    limit: 100,
  });

  if (subscriptions.length === 0) {
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p className="text-[var(--font-size-sm)]">No subscribers found.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
        {total} subscriber{total !== 1 ? 's' : ''}
      </p>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[var(--font-size-sm)]">
          <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
            <tr>
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
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                Subscribed
              </th>
              <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                  {sub.products?.name ?? '—'}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-700)]">
                  <div>{sub.phone ?? '—'}</div>
                  {sub.email && (
                    <div className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                      {sub.email}
                    </div>
                  )}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell">
                  {channelLabel(sub.channel)}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                  {statusBadge(sub.status)}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden lg:table-cell whitespace-nowrap">
                  {formatDate(sub.subscribed_at)}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                  <SubscriberActions
                    subscriptionId={sub.id}
                    currentStatus={sub.status}
                    productName={sub.products?.name ?? ''}
                    phone={sub.phone}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
