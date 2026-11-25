'use client';

/**
 * SubscriberActions
 *
 * Per-row action controls for the restock subscribers table.
 * Shows an "Unsubscribe" button for active/notified rows.
 * Calls PATCH /api/admin/restock/[id] and refreshes the page on success.
 */

import React from 'react';
import { useRouter } from 'next/navigation';

interface SubscriberActionsProps {
  subscriptionId: string;
  currentStatus: string;
  productName: string;
  phone: string | null;
}

export function SubscriberActions({
  subscriptionId,
  currentStatus,
  productName,
  phone,
}: SubscriberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleUnsubscribe() {
    if (
      !confirm(`Unsubscribe ${phone ?? 'this customer'} from restock alerts for "${productName}"?`)
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restock/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unsubscribed' }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === 'unsubscribed') {
    return <span className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">—</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={loading}
        className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-semibold border border-[var(--color-earth-200)] text-[var(--color-earth-500)] bg-white hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        aria-label={`Unsubscribe ${phone ?? ''} from ${productName}`}
      >
        {loading ? 'Saving…' : 'Unsubscribe'}
      </button>
      {error && (
        <span className="text-[var(--font-size-xs)] text-[var(--color-error)]">{error}</span>
      )}
    </div>
  );
}
