'use client';
/**
 * ReturnRequestForm: lets a customer ask to return items from a delivered order.
 * Posts to /api/returns. Signed-in customers need only the order number.
 */
import React from 'react';
import { PhotoUploader } from '@/components/PhotoUploader';

const REASONS = [
  { value: 'damaged', label: 'Item arrived damaged' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

type Item = {
  id: string;
  quantity: number;
  snapshot: { name?: string };
  returnDeadline?: string;
};

export function ReturnRequestForm({
  orderNumber,
  phone,
  signedIn,
  items,
  onSubmitted,
}: {
  orderNumber: string;
  phone: string;
  signedIn: boolean;
  items: Item[];
  onSubmitted: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  // item id -> quantity to return
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [photosBusy, setPhotosBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const field =
    'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

  function toggle(item: Item, on: boolean) {
    setSelected((s) => {
      const next = { ...s };
      if (on) next[item.id] = item.quantity;
      else delete next[item.id];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(selected).length === 0) return setError('Select at least one item to return.');
    if (!reason) return setError('Please choose a reason.');
    if (photosBusy) return setError('Please wait for your photos to finish uploading.');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          ...(signedIn ? {} : { phone }),
          reason,
          description: description.trim() || undefined,
          photos,
          items: Object.entries(selected).map(([order_item_id, quantity]) => ({
            order_item_id,
            quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not submit your return request.');
        return;
      }
      setOpen(false);
      onSubmitted();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Request a return
        </button>
        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mt-1">
          Choose which delivered items to return, and how many of each. Everything else stays as it
          is.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-5)] flex flex-col gap-[var(--spacing-4)]"
    >
      <h2 className="heading-5">Request a return</h2>
      <fieldset className="flex flex-col gap-[var(--spacing-2)]">
        <legend className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1">
          Items to return
        </legend>
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-[var(--spacing-2)] text-[var(--font-size-sm)]"
          >
            <input
              type="checkbox"
              checked={item.id in selected}
              onChange={(e) => toggle(item, e.target.checked)}
            />
            <span className="flex-1">{item.snapshot?.name ?? 'Item'}</span>
            {item.id in selected && item.quantity > 1 ? (
              <label className="flex items-center gap-1 text-[var(--color-earth-600)]">
                <span className="sr-only">
                  Quantity to return for {item.snapshot?.name ?? 'item'}
                </span>
                <select
                  value={selected[item.id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [item.id]: Number(e.target.value) }))
                  }
                  className="border border-[var(--color-earth-200)] rounded px-1 py-0.5"
                >
                  {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true">of {item.quantity}</span>
              </label>
            ) : (
              <span className="text-[var(--color-earth-500)]">× {item.quantity}</span>
            )}
            {item.returnDeadline && (
              <span className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
                until{' '}
                {new Date(item.returnDeadline).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            )}
          </label>
        ))}
      </fieldset>
      <div>
        <label
          htmlFor="return-reason"
          className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
        >
          Reason
        </label>
        <select
          id="return-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={field}
        >
          <option value="">Select a reason</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="return-description"
          className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
        >
          Details (optional)
        </label>
        <textarea
          id="return-description"
          rows={3}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={field}
        />
      </div>
      <PhotoUploader
        kind="return"
        label="Photos (optional)"
        hint="Add up to 5 photos (JPG, PNG or WebP, 5 MB each) showing the problem."
        onChange={setPhotos}
        onBusyChange={setPhotosBusy}
      />
      {error && (
        <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
          {error}
        </p>
      )}
      <div className="flex gap-[var(--spacing-3)]">
        <button
          type="submit"
          disabled={loading}
          className="px-[var(--spacing-5)] h-10 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-bold hover:bg-[var(--color-earth-700)] disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Submit request'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-[var(--spacing-5)] h-10 rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--color-earth-700)] text-[var(--font-size-sm)] font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
