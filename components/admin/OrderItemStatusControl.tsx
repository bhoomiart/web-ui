'use client';
/**
 * OrderItemStatusControl
 *
 * Status badge plus a small "move this item to…" control for ONE order line.
 * Moves only this line; the order status follows from its lines.
 * Return and refund statuses are handled on the Returns / Refunds pages.
 */
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ITEM_ACTION_LABELS, nextStatuses, isReturnOrRefundStatus } from '@/lib/orders/itemStatus';

export function OrderItemStatusControl({
  orderId,
  itemId,
  status,
}: {
  orderId: string;
  itemId: string;
  status: string;
}) {
  const router = useRouter();
  const [next, setNext] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = nextStatuses(status);

  async function apply() {
    if (!next) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, item_ids: [itemId] }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update.');
        return;
      }
      setNext('');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-[var(--spacing-2)]">
      <OrderStatusBadge status={status} />
      {options.length > 0 && (
        <div className="flex items-center gap-[var(--spacing-1)]">
          <select
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-label="Move this item to"
            className="px-[var(--spacing-2)] py-1 rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-xs)] text-[var(--color-earth-800)]"
          >
            <option value="">Move to…</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {ITEM_ACTION_LABELS[s] ?? s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={apply}
            disabled={!next || loading}
            className="px-[var(--spacing-2)] py-1 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-xs)] font-semibold disabled:opacity-50"
          >
            {loading ? '…' : 'Apply'}
          </button>
        </div>
      )}
      {options.length === 0 && isReturnOrRefundStatus(status) && (
        <Link
          href="/admin/orders/returns"
          className="text-[var(--font-size-xs)] text-[var(--color-brand-primary)] hover:underline"
        >
          Manage in Returns
        </Link>
      )}
      {error && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
