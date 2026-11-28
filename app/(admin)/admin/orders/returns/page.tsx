export const instant = false;
/**
 * /admin/orders/returns — Return requests list (A6-T5-2)
 */

import Link from 'next/link';
import { ReturnActions } from '@/components/admin/ReturnActions';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { AdminOnly } from '@/components/layout/AdminRole';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { listReturnRequests } from '@/lib/db/orders';

type StatusFilter =
  'all' | 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

function returnStatusBadge(status: string) {
  const map: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    approved: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    rejected: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
    in_transit: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    completed: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    cancelled: { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' },
  };
  const cfg = map[status] ?? { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default async function ReturnsPage({
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
        title="Return Requests"
        description="Review and manage customer return requests."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Returns' },
        ]}
        action={
          <AdminOnly>
            <Link
              href="/admin/orders/refunds"
              className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
            >
              View Refunds
            </Link>
          </AdminOnly>
        }
      />

      {/* Tabs */}
      <div className="flex gap-[var(--spacing-1)] mb-[var(--spacing-5)] border-b border-[var(--color-earth-100)]">
        {TABS.map((tab) => {
          const active = tab.key === statusFilter;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'all'
                  ? '/admin/orders/returns'
                  : `/admin/orders/returns?status=${tab.key}`
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
            <Spinner size="lg" label="Loading returns..." />
          </div>
        }
      >
        <ReturnsContent statusFilter={statusFilter} />
      </Suspense>
    </div>
  );
}

async function ReturnsContent({ statusFilter }: { statusFilter: StatusFilter }) {
  await requireStaff();
  const { returns, total } = await listReturnRequests({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 50,
  });

  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
        <p className="text-[var(--font-size-sm)]">No return requests found.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
        {total} request{total !== 1 ? 's' : ''}
      </p>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[var(--font-size-sm)]">
          <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
            <tr>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Order
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                Customer
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Items
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Reason
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Status
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                Requested
              </th>
              <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {returns.map((r) => {
              const order = r.orders as {
                id: string;
                order_number: string;
                customer_name: string;
                phone: string;
              } | null;
              return (
                <tr key={r.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {order ? (
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-[var(--color-brand-primary)] hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)] hidden md:table-cell">
                    {order?.customer_name ?? '—'}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-700)]">
                    {(
                      r.return_request_items as Array<{
                        id: string;
                        quantity: number;
                        order_items: { snapshot: { name?: string } } | null;
                      }>
                    ).map((ri) => (
                      <p key={ri.id}>
                        {ri.order_items?.snapshot?.name ?? 'Item'} × {ri.quantity}
                      </p>
                    ))}
                    {r.description && (
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mt-1">
                        “{r.description}”
                      </p>
                    )}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] capitalize text-[var(--color-earth-600)]">
                    {r.reason.replace(/_/g, ' ')}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                    {returnStatusBadge(r.status)}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden lg:table-cell whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                    <ReturnActions returnId={r.id} status={r.status} />
                    {order && (
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-[var(--font-size-xs)] font-semibold text-[var(--color-brand-primary)] hover:underline"
                      >
                        View Order
                      </Link>
                    )}
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
