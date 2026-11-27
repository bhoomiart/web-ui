'use client';
import React from 'react';

interface Props {
  initial: { returnWindowDays: number; refundProcessingDays: number; returnPolicyNote: string };
}

const inputClass =
  'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

export function RefundPolicyForm({ initial }: Props) {
  const [windowDays, setWindowDays] = React.useState(String(initial.returnWindowDays));
  const [processingDays, setProcessingDays] = React.useState(String(initial.refundProcessingDays));
  const [note, setNote] = React.useState(initial.returnPolicyNote);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const valid = (v: string) => /^\d+$/.test(v) && Number(v) <= 365;
    if (!valid(windowDays) || !valid(processingDays)) {
      setError('Days must be whole numbers between 0 and 365.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_window_days: windowDays,
          refund_processing_days: processingDays,
          return_policy_note: note.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
        return;
      }
      setSaved(true);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] max-w-2xl flex flex-col gap-[var(--spacing-5)]"
    >
      <div>
        <label
          htmlFor="return_window_days"
          className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Return window (days after delivery)
        </label>
        <input
          id="return_window_days"
          inputMode="numeric"
          value={windowDays}
          onChange={(e) => setWindowDays(e.target.value)}
          className={inputClass}
        />
        <p className="body-small mt-1">
          Return requests after this period are rejected. Use 0 to disable returns.
        </p>
      </div>
      <div>
        <label
          htmlFor="refund_processing_days"
          className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Refund processing time (days)
        </label>
        <input
          id="refund_processing_days"
          inputMode="numeric"
          value={processingDays}
          onChange={(e) => setProcessingDays(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="return_policy_note"
          className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]"
        >
          Additional policy note (optional)
        </label>
        <textarea
          id="return_policy_note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-[var(--spacing-4)]">
        <button
          type="submit"
          disabled={saving}
          className="px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save policy'}
        </button>
        {error && (
          <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-[var(--font-size-sm)] text-[var(--color-success)]">
            ✓ Saved
          </p>
        )}
      </div>
    </form>
  );
}
