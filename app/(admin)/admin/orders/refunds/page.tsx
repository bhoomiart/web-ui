export const instant = false;
/**
 * /admin/orders/refunds — Refunds list + create form (A6-T5-4, A6-T5-5)
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { listRefunds } from '@/lib/db/orders';
import { RecordRefundForm } from './RecordRefundForm';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export default async function RefundsPage() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Refunds"
        description="Record and track refunds issued to customers."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Refunds' },
        ]}
      />

      <div className="grid lg:grid-cols-[1fr_380px] gap-[var(--spacing-8)]">
        {/* Refunds list */}
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner size="lg" label="Loading refunds..." />
            </div>
          }
        >
          <RefundsList />
        </Suspense>

        {/* Record refund form */}
        <div>
          <h2 className="heading-5 mb-[var(--spacing-4)]">Record a Refund</h2>
          <RecordRefundForm />
        </div>
      </div>
    </div>
  );
}

async function RefundsList() {
  await requireAdmin();
  const { refunds, total } = await listRefunds({ limit: 50 });

  if (refunds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-earth-400)]">
        <p className="text-[var(--font-size-sm)]">No refunds recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-[var(--spacing-3)]">
        {total} refund{total !== 1 ? 's' : ''}
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
              <th className="text-right px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)]">
                Amount
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                Method
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden lg:table-cell">
                Type
              </th>
              <th className="text-left px-[var(--spacing-4)] py-[var(--spacing-3)] font-semibold text-[var(--color-earth-600)] hidden xl:table-cell">
                Processed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {refunds.map((r) => {
              const order = r.orders as {
                id: string;
                order_number: string;
                customer_name: string;
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
                  <td
                    className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-right font-bold"
                    style={{ color: 'var(--color-brand-primary)' }}
                  >
                    {fmt(r.amount)}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] capitalize text-[var(--color-earth-600)] hidden lg:table-cell">
                    {r.method.replace(/_/g, ' ')}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] capitalize text-[var(--color-earth-600)] hidden lg:table-cell">
                    {r.refund_type.replace('_', ' ')}
                  </td>
                  <td className="px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--color-earth-500)] hidden xl:table-cell">
                    {formatDate(r.processed_at)}
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
