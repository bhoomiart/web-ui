export const instant = false;
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
/**
 * /admin/inventory — Inventory overview page.
 * Color-codes available stock: red if 0, amber if <= threshold, green otherwise.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { getInventoryWithProduct } from '@/lib/db/inventory';

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

export default async function InventoryPagePage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Monitor stock levels."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Inventory' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading..." />
          </div>
        }
      >
        <InventoryPageContent />
      </Suspense>
    </div>
  );
}

async function InventoryPageContent() {
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

  const inventoryRows = rows as InventoryRow[];

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Monitor stock levels across all products."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Inventory' }]}
      />

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
        <>
          {/* Legend */}
          <div className="flex items-center gap-[var(--spacing-4)] mb-[var(--spacing-4)] text-[var(--font-size-xs)]">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--color-error)' }}
              />
              <span className="text-[var(--color-earth-500)]">Out of stock</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--color-warning)' }}
              />
              <span className="text-[var(--color-earth-500)]">Low stock (≤ threshold)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--color-success)' }}
              />
              <span className="text-[var(--color-earth-500)]">In stock</span>
            </span>
          </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-earth-100)]">
                {inventoryRows.map((row) => {
                  const color = stockColor(row.available_stock, row.low_stock_threshold);
                  const bg = stockBg(row.available_stock, row.low_stock_threshold);
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
