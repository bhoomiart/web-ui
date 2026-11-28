'use client';
import React from 'react';
import { SHIPPING_FALLBACK_STATE } from '@/lib/cart/constants';

interface Rate {
  state: string;
  fee: number;
  freeAbove: number | null;
  isActive: boolean;
}

interface Row {
  state: string;
  fee: string;
  freeAbove: string;
  isActive: boolean;
}

const inputClass =
  'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-900)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

const toRow = (r: Rate): Row => ({
  state: r.state,
  fee: String(r.fee),
  freeAbove: r.freeAbove == null ? '' : String(r.freeAbove),
  isActive: r.isActive,
});

const isAmount = (v: string) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 100000;

export function ShippingRatesForm({ initial }: { initial: Rate[] }) {
  const [rows, setRows] = React.useState<Row[]>(() => initial.map(toRow));
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bulkFee, setBulkFee] = React.useState('');
  const [bulkFree, setBulkFree] = React.useState('');

  function update(state: string, patch: Partial<Row>) {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.state === state ? { ...r, ...patch } : r)));
  }

  function applyToAll() {
    setError(null);
    if (bulkFee && !isAmount(bulkFee)) return setError('Enter a valid fee to apply.');
    if (bulkFree && !isAmount(bulkFree)) return setError('Enter a valid free-shipping amount.');
    setSaved(false);
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        fee: bulkFee || r.fee,
        freeAbove: bulkFree || r.freeAbove,
      }))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    for (const r of rows) {
      const label = r.state === SHIPPING_FALLBACK_STATE ? 'Default' : r.state;
      if (!isAmount(r.fee)) return setError(`${label}: enter a fee from 0 to 100000.`);
      if (r.freeAbove !== '' && !isAmount(r.freeAbove)) {
        return setError(`${label}: free-shipping amount must be from 0 to 100000, or blank.`);
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/shipping-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rates: rows.map((r) => ({
            state: r.state,
            fee: Number(r.fee),
            freeAbove: r.freeAbove === '' ? null : Number(r.freeAbove),
            isActive: r.isActive,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) return setError(data.error ?? 'Failed to save.');
      setSaved(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] max-w-4xl flex flex-col gap-[var(--spacing-6)]"
    >
      {/* Bulk fill */}
      <fieldset className="flex flex-wrap items-end gap-[var(--spacing-4)] border border-[var(--color-earth-100)] rounded-[var(--radius-md)] p-[var(--spacing-4)]">
        <legend className="px-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]">
          Fill all rows
        </legend>
        <div className="w-36">
          <label htmlFor="bulk_fee" className="block text-[var(--font-size-xs)] mb-1">
            Fee (₹)
          </label>
          <input
            id="bulk_fee"
            inputMode="decimal"
            value={bulkFee}
            onChange={(e) => setBulkFee(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="w-44">
          <label htmlFor="bulk_free" className="block text-[var(--font-size-xs)] mb-1">
            Free above (₹)
          </label>
          <input
            id="bulk_free"
            inputMode="decimal"
            value={bulkFree}
            onChange={(e) => setBulkFree(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={applyToAll}
          className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-100)] transition-colors"
        >
          Apply to all
        </button>
        <p className="body-small basis-full">
          Fills the table below. Nothing is saved until you press Save rates.
        </p>
      </fieldset>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Shipping rate per delivery state</caption>
          <thead>
            <tr className="text-[var(--font-size-xs)] uppercase tracking-wide text-[var(--color-earth-500)]">
              <th scope="col" className="py-2 pr-4 font-semibold">
                State
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold w-32">
                Fee (₹)
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold w-40">
                Free above (₹)
              </th>
              <th scope="col" className="py-2 font-semibold w-24">
                Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-earth-100)]">
            {rows.map((r) => {
              const isDefault = r.state === SHIPPING_FALLBACK_STATE;
              const label = isDefault ? 'Default (other states)' : r.state;
              return (
                <tr key={r.state}>
                  <th scope="row" className="py-2 pr-4 text-[var(--font-size-sm)] font-medium">
                    {label}
                  </th>
                  <td className="py-2 pr-4">
                    <input
                      aria-label={`Fee for ${label}`}
                      inputMode="decimal"
                      value={r.fee}
                      onChange={(e) => update(r.state, { fee: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      aria-label={`Free shipping above for ${label}`}
                      inputMode="decimal"
                      placeholder="Never"
                      value={r.freeAbove}
                      onChange={(e) => update(r.state, { freeAbove: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      aria-label={`${label} rate active`}
                      checked={r.isActive}
                      disabled={isDefault}
                      onChange={(e) => update(r.state, { isActive: e.target.checked })}
                      className="w-4 h-4 accent-[var(--color-brand-primary)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-[var(--spacing-4)]">
        <button
          type="submit"
          disabled={saving}
          className="px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save rates'}
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
