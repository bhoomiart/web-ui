export const instant = false;
/**
 * /admin/dashboard — Admin overview page.
 * Full implementation: metrics, recent orders, low-stock products.
 */

import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/admin';
import { getDashboardMetrics, getRecentOrders, getLowStockProducts } from '@/lib/db/dashboard';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default async function DashboardPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Overview of your store." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const [metrics, recentOrders, lowStock] = await Promise.all([
    getDashboardMetrics(),
    getRecentOrders(10),
    getLowStockProducts(8),
  ]);

  return (
    <div className="flex flex-col gap-[var(--spacing-8)]">
      {/* ── Metric grid ─────────────────────────────────────────── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)]">
          <MetricCard
            label="Active Products"
            value={metrics.products.active}
            href="/admin/products"
            icon={<ProductIcon />}
          />
          <MetricCard
            label="Categories"
            value={metrics.categories.total}
            href="/admin/categories"
            icon={<CategoryIcon />}
          />
          <MetricCard
            label="Total Orders"
            value={metrics.orders.total}
            href="/admin/orders"
            icon={<OrderIcon />}
          />
          <MetricCard
            label="Pending Orders"
            value={metrics.orders.pending}
            href="/admin/orders/pending"
            variant={metrics.orders.pending > 0 ? 'warning' : 'default'}
            icon={<ClockIcon />}
          />
          <MetricCard
            label="Delivered"
            value={metrics.orders.delivered}
            href="/admin/orders/completed"
            variant="success"
            icon={<CheckIcon />}
          />
          <MetricCard
            label="Out of Stock"
            value={metrics.inventory.outOfStock}
            href="/admin/inventory/out-of-stock"
            variant={metrics.inventory.outOfStock > 0 ? 'error' : 'default'}
            icon={<BoxIcon />}
          />
          <MetricCard
            label="Low Stock"
            value={metrics.inventory.lowStock}
            href="/admin/inventory/low-stock"
            variant={metrics.inventory.lowStock > 0 ? 'warning' : 'default'}
            icon={<WarningIcon />}
          />
          <MetricCard
            label="Restock Subscribers"
            value={metrics.restock.activeSubscribers}
            href="/admin/restock/subscribers"
            icon={<BellIcon />}
          />
          <MetricCard
            label="Cancellations"
            value={metrics.orders.cancellationRequested}
            href="/admin/orders/cancellations"
            variant={metrics.orders.cancellationRequested > 0 ? 'error' : 'default'}
            icon={<XIcon />}
          />
          <MetricCard
            label="Return Requests"
            value={metrics.orders.returnRequested}
            href="/admin/orders/returns"
            variant={metrics.orders.returnRequested > 0 ? 'warning' : 'default'}
            icon={<ReturnIcon />}
          />
          <MetricCard
            label="Pending Refunds"
            value={metrics.orders.refundPending}
            href="/admin/orders/refunds"
            variant={metrics.orders.refundPending > 0 ? 'warning' : 'default'}
            icon={<RefundIcon />}
          />
          <MetricCard
            label="Pending Reviews"
            value={metrics.reviews.pending}
            href="/admin/reviews"
            variant={metrics.reviews.pending > 0 ? 'warning' : 'default'}
            icon={<StarIcon />}
          />
        </div>
      </section>

      {/* ── Two-column lower section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--spacing-6)]">
        {/* Recent orders */}
        <section aria-label="Recent orders">
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-4)] border-b border-[var(--color-earth-100)]">
              <h2 className="heading-5">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-[var(--font-size-xs)] font-semibold text-[var(--color-brand-primary)] hover:underline"
              >
                View all →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptySlot text="No orders yet." />
            ) : (
              <div className="divide-y divide-[var(--color-earth-100)]">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-[var(--spacing-3)] px-[var(--spacing-5)] py-[var(--spacing-3)] hover:bg-[var(--color-earth-50)] transition-colors duration-[var(--duration-fast)]"
                  >
                    <div className="min-w-0">
                      <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] truncate">
                        {order.customer_name}
                      </p>
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                        #{order.order_number} · {(order.order_items as unknown[]).length} item
                        {(order.order_items as unknown[]).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Low stock */}
        <section aria-label="Low stock products">
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-4)] border-b border-[var(--color-earth-100)]">
              <h2 className="heading-5">Low Stock</h2>
              <Link
                href="/admin/inventory/low-stock"
                className="text-[var(--font-size-xs)] font-semibold text-[var(--color-brand-primary)] hover:underline"
              >
                View all →
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <EmptySlot text="All products are well-stocked." color="var(--color-success)" />
            ) : (
              <div className="divide-y divide-[var(--color-earth-100)]">
                {lowStock.map((item) => {
                  const product = item.products as { name: string; sku: string | null } | null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-[var(--spacing-3)] px-[var(--spacing-5)] py-[var(--spacing-3)]"
                    >
                      <div className="min-w-0">
                        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] truncate">
                          {product?.name ?? 'Unknown'}
                        </p>
                        {product?.sku && (
                          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className="text-[var(--font-size-sm)] font-bold"
                          style={{
                            color:
                              (item.available_stock ?? 0) <= 2
                                ? 'var(--color-error)'
                                : 'var(--color-warning)',
                          }}
                        >
                          {item.available_stock ?? 0}
                        </span>
                        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                          / {item.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center py-[var(--spacing-24)]">
      <Spinner size="lg" label="Loading dashboard…" />
    </div>
  );
}

function EmptySlot({ text, color }: { text: string; color?: string }) {
  return (
    <div className="flex items-center justify-center py-[var(--spacing-12)]">
      <p
        className="text-[var(--font-size-sm)]"
        style={{ color: color ?? 'var(--color-earth-400)' }}
      >
        {text}
      </p>
    </div>
  );
}

// Icons
function ProductIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
      />
    </svg>
  );
}
function CategoryIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}
function OrderIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
      />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
function XIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}
function RefundIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}
