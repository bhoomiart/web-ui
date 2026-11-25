export const instant = false;
/**
 * /admin/inventory/out-of-stock — Products with zero available stock.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { getInventoryWithProduct } from '@/lib/db/inventory';
import { listRestockSubscriptions } from '@/lib/db/restock';
import { StockAdjustClient } from '../StockAdjustClient';

export default async function OutOfStockPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Out of Stock"
        description="Products with zero available stock. Restock or manage subscriber notifications."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Inventory', href: '/admin/inventory' },
          { label: 'Out of Stock' },
        ]}
        action={
          <Link
            href="/admin/restock/notifications"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Manage Notifications
          </Link>
        }
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <OutOfStockContent />
      </Suspense>
    </div>
  );
}

async function OutOfStockContent() {
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
  const all = rows as InventoryRow[];

  const filtered = all.filter((r) => (r.available_stock ?? 0) === 0);

  // Build subscriber count per product
  const subCountByProduct: Record<string, number> = {};
  for (const s of subscriptions) {
    subCountByProduct[s.product_id] = (subCountByProduct[s.product_id] ?? 0) + 1;
  }

  if (filtered.length === 0) {
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
          No products are out of stock.
        </p>
        <Link
          href="/admin/inventory"
          className="mt-3 text-[var(--font-size-sm)] text-[var(--color-brand-primary)] hover:underline font-semibold"
        >
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-[var(--spacing-4)] py-[var(--spacing-3)] bg-[var(--color-error-light)] border-b border-[var(--color-error)]">
        <p
          className="text-[var(--font-size-sm)] font-semibold"
          style={{ color: 'var(--color-error)' }}
        >
          {filtered.length} product{filtered.length !== 1 ? 's' : ''} out of stock
        </p>
      </div>
      <table className="w-full text-[var(--font-size-sm)]">
        <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
          <tr>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Product
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
              Reserved
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
              Waiting Subscribers
            </th>
            <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-earth-100)]">
          {filtered.map((row) => {
            const subCount = subCountByProduct[row.product_id] ?? 0;
            return (
              <tr key={row.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)]">
                  <span className="font-semibold text-[var(--color-earth-900)]">
                    {row.products?.name ?? '—'}
                  </span>
                  <span
                    className="ml-[var(--spacing-2)] inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold"
                    style={{ color: 'var(--color-error)', background: 'var(--color-error-light)' }}
                  >
                    0
                  </span>
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)] hidden md:table-cell">
                  {row.reserved_stock}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right hidden lg:table-cell">
                  {subCount > 0 ? (
                    <Link
                      href={`/admin/restock/subscribers?product=${row.product_id}`}
                      className="text-[var(--color-brand-primary)] font-semibold hover:underline"
                    >
                      {subCount} waiting
                    </Link>
                  ) : (
                    <span className="text-[var(--color-earth-400)]">—</span>
                  )}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right whitespace-nowrap">
                  <StockAdjustClient
                    inventoryId={row.id}
                    productName={row.products?.name ?? 'Product'}
                    availableStock={0}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
