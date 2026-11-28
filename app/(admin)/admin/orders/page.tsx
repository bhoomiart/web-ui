export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/orders — Order list page.
 * Server Component. Supports search and status tab filtering via searchParams.
 */

import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { listOrders } from '@/lib/db/orders';

type TabKey = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_TABS: { key: TabKey; label: string; value?: string }[] = [
  { key: 'all', label: 'All', value: 'all' },
  { key: 'pending', label: 'Pending', value: 'pending' },
  { key: 'processing', label: 'Processing', value: 'processing' },
  { key: 'shipped', label: 'Shipped', value: 'shipped' },
  { key: 'delivered', label: 'Delivered', value: 'delivered' },
  { key: 'cancelled', label: 'Cancelled', value: 'cancelled' },
];

function paymentBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    received: {
      label: 'Received',
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
    },
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const { q: rawQ, status: rawStatus } = await searchParams;
  const search = typeof rawQ === 'string' ? rawQ : undefined;
  const statusParam = typeof rawStatus === 'string' ? rawStatus : undefined;
  const activeTab = (statusParam ?? 'all') as TabKey;

  const { orders } = await listOrders({
    search,
    status: statusParam,
    limit: 50,
  });

  // Build query string helpers
  function tabHref(tab: { key: TabKey; value?: string }) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (tab.value) params.set('status', tab.value);
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  function searchHref(q: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (statusParam) params.set('status', statusParam);
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="View and manage customer orders."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Orders' }]}
      />

      {/* Search bar */}
      <form method="GET" action="/admin/orders" className="mb-[var(--spacing-5)]">
        {statusParam && <input type="hidden" name="status" value={statusParam} />}
        <div className="relative max-w-sm">
          <svg
            className="absolute left-[var(--spacing-3)] top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-earth-400)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search order #, name, phone…"
            className="w-full pl-9 pr-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-800)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent"
          />
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex gap-[var(--spacing-1)] mb-[var(--spacing-5)] border-b border-[var(--color-earth-100)]">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tabHref(tab)}
              className={`px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
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
          <p className="text-[var(--font-size-sm)]">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <table className="w-full text-[var(--font-size-sm)]">
            <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
              <tr>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Order #
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Customer
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                  Phone
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden sm:table-cell">
                  Items
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Status
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Payment
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden xl:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-100)]">
              {orders.map((order) => {
                const itemCount = (order.order_items as unknown[]).length;
                return (
                  <tr key={order.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-[var(--color-brand-primary)] hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.customer_name}
                      </Link>
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden md:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)] hidden sm:table-cell">
                      {itemCount}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] hidden lg:table-cell">
                      {paymentBadge(order.payment_status)}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-400)] hidden xl:table-cell whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
