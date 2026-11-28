'use client';
/**
 * ReturnActions: move one return request along (approve / reject, in transit, received).
 * Only the items inside this return change status. Other items on the order are untouched.
 * On "received" the admin chooses whether the items go back into stock.
 */
import React from 'react';
import { useRouter } from 'next/navigation';

const NEXT: Record<string, Array<{ status: string; label: string; danger?: boolean }>> = {
  pending: [
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject', danger: true },
  ],
  approved: [{ status: 'in_transit', label: 'Mark in transit' }],
  in_transit: [{ status: 'completed', label: 'Mark received' }],
};

export function ReturnActions({ returnId, status }: { returnId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [restock, setRestock] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const actions = NEXT[status] ?? [];
  if (actions.length === 0) return null;

  async function go(next: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: next,
          admin_notes: notes.trim() || undefined,
          restock: next === 'completed' ? restock : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to update.');
        return;
      }
      setNotes('');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-[var(--spacing-2)]">
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Note (optional)"
        aria-label="Note for this return"
        className="w-44 px-[var(--spacing-2)] py-1 rounded-[var(--radius-md)] border border-[var(--color-earth-200)] text-[var(--font-size-xs)]"
      />
      {status === 'in_transit' && (
        <label className="flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-earth-700)]">
          <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
          Add items back to stock
        </label>
      )}
      <div className="flex gap-[var(--spacing-1)]">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={loading}
            onClick={() => go(a.status)}
            className={`px-[var(--spacing-3)] py-1 rounded-[var(--radius-button)] text-[var(--font-size-xs)] font-semibold disabled:opacity-50 ${
              a.danger
                ? 'border border-[var(--color-error)] text-[var(--color-error)]'
                : 'bg-[var(--color-brand-primary)] text-white'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
