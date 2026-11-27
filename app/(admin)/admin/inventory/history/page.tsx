export const instant = false;
/**
 * /admin/inventory/history — Inventory movement history (A4-T3)
 *
 * Shows all inventory_movements ordered by most recent.
 * Server Component with Suspense; movements fetched via listInventoryMovements().
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { listInventoryMovements } from '@/lib/db/inventory';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  restock: 'Restock',
  production: 'New Production',
  damaged: 'Damaged',
  manual_correction: 'Manual Correction',
  order_reserved: 'Order Reserved',
  order_released: 'Order Released',
  order_fulfilled: 'Order Fulfilled',
  return_restocked: 'Return Restocked',
};

function changeTypeBadge(type: string) {
  const label = CHANGE_TYPE_LABELS[type] ?? type;
  const colorMap: Record<string, { color: string; bg: string }> = {
    restock: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    production: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    return_restocked: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    damaged: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
    order_reserved: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    order_released: { color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    order_fulfilled: { color: 'var(--color-earth-700)', bg: 'var(--color-earth-100)' },
    manual_correction: { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' },
  };
  const cfg = colorMap[type] ?? { color: 'var(--color-earth-500)', bg: 'var(--color-earth-100)' };
  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {label}
    </span>
  );
}

export default async function InventoryHistoryPage() {
  await requireStaff();

  return (
    <div>
      <AdminPageHeader
        title="Inventory History"
        description="All stock movements — restocks, adjustments, order reservations and releases."
        action={
          <Link
            href="/api/admin/inventory/history/export"
            className="inline-flex items-center px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)] transition-colors"
          >
            Export CSV
          </Link>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Inventory', href: '/admin/inventory' },
          { label: 'History' },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading movements..." />
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

  const movements = await listInventoryMovements(undefined, 100);

  type Movement = (typeof movements)[number] & {
    inventory: {
      product_id: string;
      products: { name: string; slug: string } | null;
    } | null;
  };
  const rows = movements as Movement[];

  if (rows.length === 0) {
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
        <p className="text-[var(--font-size-sm)]">No inventory movements recorded yet.</p>
      </div>
    );
  }

  return (
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
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden md:table-cell">
              Type
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Before
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              Change
            </th>
            <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
              After
            </th>
            <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-earth-100)]">
          {rows.map((m) => {
            const isPositive = m.change_qty > 0;
            return (
              <tr key={m.id} className="hover:bg-[var(--color-earth-50)] transition-colors">
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] whitespace-nowrap">
                  {formatDate(m.created_at)}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-900)]">
                  {m.inventory?.products?.name ?? '—'}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] hidden md:table-cell">
                  {changeTypeBadge(m.change_type)}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right text-[var(--color-earth-500)]">
                  {m.previous_qty}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-bold">
                  <span
                    style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-error)' }}
                  >
                    {isPositive ? '+' : ''}
                    {m.change_qty}
                  </span>
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-semibold text-[var(--color-earth-800)]">
                  {m.new_qty}
                </td>
                <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden lg:table-cell max-w-xs truncate">
                  {m.order_id ? (
                    <Link
                      href={`/admin/orders/${m.order_id}`}
                      className="text-[var(--color-brand-primary)] hover:underline"
                    >
                      Order link
                    </Link>
                  ) : (
                    (m.reason ?? '—')
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
