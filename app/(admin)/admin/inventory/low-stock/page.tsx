export const instant = false;
/**
 * /admin/inventory/low-stock — Products with stock at or below threshold.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { getInventoryWithProduct } from '@/lib/db/inventory';
import { StockAdjustClient } from '../StockAdjustClient';

export default async function LowStockPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Low Stock"
        description="Products with available stock at or below their low-stock threshold."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Inventory', href: '/admin/inventory' },
          { label: 'Low Stock' },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <LowStockContent />
      </Suspense>
    </div>
  );
}

async function LowStockContent() {
  await requireStaff();

  const rows = await getInventoryWithProduct();

  type Product = {
    id: string;
    name: string;
    slug: string;
    status: string;
    availability_type: string;
  } | null;
  type InventoryRow = (typeof rows)[number] & { products: Product };
  const all = rows as InventoryRow[];

  const filtered = all.filter(
    (r) => (r.available_stock ?? 0) > 0 && (r.available_stock ?? 0) <= r.low_stock_threshold
  );

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
          No low-stock products right now.
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
      <div className="px-[var(--spacing-4)] py-[var(--spacing-3)] bg-[var(--color-warning-light)] border-b border-[var(--color-warning)]">
        <p
          className="text-[var(--font-size-sm)] font-semibold"
          style={{ color: 'var(--color-warning)' }}
        >
          {filtered.length} product{filtered.length !== 1 ? 's' : ''} with stock at or below
          threshold
        </p>
      </div>
      <table className="w-full text-[var(--font-size-sm)]">
        <thead className="bg-[var(--color-earth-50)] border-b border-[var(--color-earth-100)]">
          <tr>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Product
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden sm:table-cell">
              Total
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Available
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Threshold
            </th>
            <th className="px-[var(--spacing-4)] py-[var(--spacing-3)]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-earth-100)]">
          {filtered.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                {row.products?.name ?? '—'}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-700)] hidden sm:table-cell">
                {row.total_stock}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                <span
                  className="inline-flex items-center justify-center min-w-[2.5rem] px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold"
                  style={{
                    color: 'var(--color-warning)',
                    background: 'var(--color-warning-light)',
                  }}
                >
                  {row.available_stock ?? 0}
                </span>
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)]">
                {row.low_stock_threshold}
              </td>
              <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right">
                <StockAdjustClient
                  inventoryId={row.id}
                  productName={row.products?.name ?? 'Product'}
                  availableStock={row.available_stock ?? 0}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
