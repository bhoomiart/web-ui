'use client';

/**
 * RecordRefundForm — admin form to record a refund for an order.
 * Calls POST /api/admin/refunds.
 */

import React from 'react';
import { useRouter } from 'next/navigation';

const inputClass =
  'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-800)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/20';

export function RecordRefundForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    order_id: '',
    amount: '',
    refund_type: 'full',
    method: 'bank_transfer',
    reference_id: '',
    processed_at: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.order_id.trim() || !form.amount) {
      setError('Order ID and amount are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          processed_at: form.processed_at || undefined,
          reference_id: form.reference_id || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to record refund.');
        return;
      }
      setSuccess(true);
      setForm({
        order_id: '',
        amount: '',
        refund_type: 'full',
        method: 'bank_transfer',
        reference_id: '',
        processed_at: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)] flex flex-col gap-[var(--spacing-4)]"
    >
      {success && (
        <div
          className="px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] bg-[var(--color-success-light)] text-[var(--color-success)] text-[var(--font-size-sm)]"
          role="status"
        >
          Refund recorded successfully.
        </div>
      )}

      {[
        { label: 'Order ID', id: 'order_id', type: 'text', placeholder: 'UUID of the order' },
        { label: 'Amount (₹)', id: 'amount', type: 'number', placeholder: '500' },
        {
          label: 'Reference ID (optional)',
          id: 'reference_id',
          type: 'text',
          placeholder: 'UTR / transaction ID',
        },
        { label: 'Processed Date', id: 'processed_at', type: 'date', placeholder: '' },
      ].map(({ label, id, type, placeholder }) => (
        <div key={id}>
          <label
            htmlFor={id}
            className="block text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
          >
            {label}
          </label>
          <input
            id={id}
            type={type}
            value={(form as Record<string, string>)[id]}
            onChange={(e) => set(id, e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
        </div>
      ))}

      <div>
        <label
          htmlFor="refund_type"
          className="block text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Type
        </label>
        <select
          id="refund_type"
          value={form.refund_type}
          onChange={(e) => set('refund_type', e.target.value)}
          className={inputClass}
        >
          <option value="full">Full Refund</option>
          <option value="partial">Partial Refund</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="method"
          className="block text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Method
        </label>
        <select
          id="method"
          value={form.method}
          onChange={(e) => set('method', e.target.value)}
          className={inputClass}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="store_credit">Store Credit</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="ref-notes"
          className="block text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Notes (optional)
        </label>
        <textarea
          id="ref-notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
      >
        {loading ? (
          <span
            className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
            aria-hidden="true"
          />
        ) : (
          'Record Refund'
        )}
      </button>
    </form>
  );
}
