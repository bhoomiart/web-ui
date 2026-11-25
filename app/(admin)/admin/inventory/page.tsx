export const instant = false;
/**
 * /admin/inventory — Inventory overview dashboard (A4-T1 + A4-T2)
 *
 * Overview cards + filterable stock table with per-row adjust button.
 * Server Component shell → Suspense → InventoryContent (also Server).
 * StockAdjustClient provides the interactive adjustment controls client-side.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { getInventoryWithProduct } from '@/lib/db/inventory';
import { listRestockSubscriptions } from '@/lib/db/restock';
import { StockAdjustClient } from './StockAdjustClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stockColor(available: number | null, threshold: number): string {
  const qty = available ?? 0;
  if (qty === 0) return 'var(--color-error)';
  if (qty <= threshold) return 'var(--color-warning)';
  return 'var(--color-success)';
}

function stockBg(available: number | null, threshold: number): string {
  const qty = available ?? 0;
  if (qty === 0) return 'var(--color-error-light)';
  if (qty <= threshold) return 'var(--color-warning-light)';
  return 'var(--color-success-light)';
}

function MetricCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number;
  color?: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] px-[var(--spacing-5)] py-[var(--spacing-4)]">
      <p className="text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-500)] uppercase tracking-wide mb-[var(--spacing-1)]">
        {label}
      </p>
      <p
        className="text-[var(--font-size-3xl)] font-bold"
        style={{ color: color ?? 'var(--color-earth-900)' }}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default async function InventoryPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Monitor and adjust stock levels across all products."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Inventory' }]}
        action={
          <Link
            href="/admin/inventory/history"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
          >
            View History
          </Link>
        }
      />

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading inventory..." />
          </div>
        }
      >
        <InventoryContent />
      </Suspense>
    </div>
  );
}

// ─── Data-fetching inner component ────────────────────────────────────────────

async function InventoryContent() {
  await requireStaff();

  const [rows, { subscriptions }] = await Promise.all([
    getInventoryWithProduct(),
    listRestockSubscriptions({ status: 'active' }),
  ]);

  type Product = {
    id: string;
    name: string;
    slug: string;
    status: string;
    availability_type: string;
  } | null;
  type InventoryRow = (typeof rows)[number] & { products: Product };
  const inventoryRows = rows as InventoryRow[];

  // Compute overview counts
  const total = inventoryRows.length;
  const inStock = inventoryRows.filter(
    (r) => (r.available_stock ?? 0) > r.low_stock_threshold
  ).length;
  const lowStock = inventoryRows.filter(
    (r) => (r.available_stock ?? 0) > 0 && (r.available_stock ?? 0) <= r.low_stock_threshold
  ).length;
  const outOfStock = inventoryRows.filter((r) => (r.available_stock ?? 0) === 0).length;
  const restockSubscribers = subscriptions.length;

  // Build a subscriber count per product for the table
  const subCountByProduct: Record<string, number> = {};
  for (const s of subscriptions) {
    subCountByProduct[s.product_id] = (subCountByProduct[s.product_id] ?? 0) + 1;
  }

  return (
    <div>
      {/* ── Overview cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[var(--spacing-4)] mb-[var(--spacing-6)]">
        <MetricCard label="Total SKUs" value={total} />
        <MetricCard label="In Stock" value={inStock} color="var(--color-success)" />
        <MetricCard
          label="Low Stock"
          value={lowStock}
          color="var(--color-warning)"
          href="/admin/inventory/low-stock"
        />
        <MetricCard
          label="Out of Stock"
          value={outOfStock}
          color="var(--color-error)"
          href="/admin/inventory/out-of-stock"
        />
        <MetricCard
          label="Restock Subscribers"
          value={restockSubscribers}
          href="/admin/restock/subscribers"
        />
      </div>

      {/* ── Filter quick-links ── */}
      <div className="flex gap-[var(--spacing-2)] mb-[var(--spacing-5)]">
        {[
          { label: 'All', href: '/admin/inventory' },
          { label: 'Low Stock', href: '/admin/inventory/low-stock' },
          { label: 'Out of Stock', href: '/admin/inventory/out-of-stock' },
          { label: 'Movement History', href: '/admin/inventory/history' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold bg-white border border-[var(--color-earth-200)] text-[var(--color-earth-600)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* ── Color legend ── */}
      <div className="flex items-center gap-[var(--spacing-4)] mb-[var(--spacing-4)] text-[var(--font-size-xs)]">
        {[
          { color: 'var(--color-error)', label: 'Out of stock' },
          { color: 'var(--color-warning)', label: 'Low stock (≤ threshold)' },
          { color: 'var(--color-success)', label: 'In stock' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[var(--color-earth-500)]">{item.label}</span>
          </span>
        ))}
      </div>

      {inventoryRows.length === 0 ? (
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
            />
          </svg>
          <p className="text-[var(--font-size-sm)]">No inventory records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <table className="w-full text-[var(--font-size-sm)]">
            <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
              <tr>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Product
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden sm:table-cell">
                  Total
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
                  Reserved
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                  Available
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Threshold
                </th>
                <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden xl:table-cell">
                  Tracking
                </th>
                <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                  Subscribers
                </th>
                <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-earth-100)]">
              {inventoryRows.map((row) => {
                const color = stockColor(row.available_stock, row.low_stock_threshold);
                const bg = stockBg(row.available_stock, row.low_stock_threshold);
                const subCount = subCountByProduct[row.product_id] ?? 0;

                return (
                  <tr key={row.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                      <span className="font-semibold text-[var(--color-earth-900)]">
                        {row.products?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)] hidden sm:table-cell">
                      {row.total_stock}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)] hidden md:table-cell">
                      {row.reserved_stock}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                      <span
                        className="inline-flex items-center justify-center min-w-[2.5rem] px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold"
                        style={{ color, background: bg }}
                      >
                        {row.available_stock ?? 0}
                      </span>
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)] hidden lg:table-cell">
                      {row.low_stock_threshold}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] hidden xl:table-cell">
                      {row.tracking_enabled ? (
                        <span
                          className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                          style={{
                            color: 'var(--color-success)',
                            background: 'var(--color-success-light)',
                          }}
                        >
                          Enabled
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold"
                          style={{
                            color: 'var(--color-earth-400)',
                            background: 'var(--color-earth-100)',
                          }}
                        >
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right hidden lg:table-cell">
                      {subCount > 0 ? (
                        <Link
                          href={`/admin/restock/subscribers?product=${row.product_id}`}
                          className="text-[var(--color-brand-primary)] font-semibold hover:underline text-[var(--font-size-xs)]"
                        >
                          {subCount}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-earth-400)] text-[var(--font-size-xs)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right whitespace-nowrap">
                      <StockAdjustClient
                        inventoryId={row.id}
                        productName={row.products?.name ?? 'Product'}
                        availableStock={row.available_stock ?? 0}
                      />
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
