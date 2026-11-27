'use client';

/**
 * ReviewForm (A7-T1-1, A7-T1-2)
 *
 * Star-rating picker + name + review text form. Shown only for delivered orders
 * (order details / track page). Calls POST /api/reviews with order number + phone,
 * which the server verifies. Shows a success message on completion.
 * Rate-limit enforced server-side (one review per name per product).
 */

import React from 'react';
import { trackEvent } from '@/lib/analytics';

interface ReviewFormProps {
  productId: string;
  productName: string;
  /** Order the product was bought in. The server verifies it is delivered. */
  orderNumber: string;
  /** Phone used on the order (second factor for the order lookup). */
  phone: string;
  /** Pre-filled display name, normally the order's customer name. */
  defaultName?: string;
  onSubmitted?: () => void;
}

type State = 'idle' | 'loading' | 'success' | 'error';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = React.useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-[var(--spacing-1)]" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] rounded-sm"
        >
          <svg
            className="w-7 h-7 transition-colors"
            viewBox="0 0 20 20"
            fill={star <= display ? 'var(--color-warning)' : 'var(--color-earth-200)'}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  productId,
  productName,
  orderNumber,
  phone,
  defaultName = '',
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [name, setName] = React.useState(defaultName);
  const [body, setBody] = React.useState('');
  const [state, setState] = React.useState<State>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      setErrorMsg('Please select a star rating.');
      setState('error');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Your name is required.');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_number: orderNumber,
          phone,
          customer_name: name.trim(),
          rating,
          body: body.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to submit review.');
        setState('error');
        return;
      }

      trackEvent('review_submit', { product_id: productId, rating });
      setState('success');
      onSubmitted?.();
    } catch {
      setErrorMsg('Network error — please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div
        className="rounded-[var(--radius-xl)] p-[var(--spacing-6)] text-center"
        style={{ background: 'var(--color-success-light)' }}
      >
        <p className="text-[var(--font-size-2xl)] mb-[var(--spacing-2)]" aria-hidden="true">
          ⭐
        </p>
        <p className="font-semibold text-[var(--color-success)] mb-[var(--spacing-1)]">
          Thank you for your review!
        </p>
        <p className="text-[var(--font-size-sm)] text-[var(--color-success)]">
          It&apos;s pending approval and will appear here shortly.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-6)]"
      style={{ background: 'var(--color-earth-50)' }}
    >
      <h3 className="heading-5 mb-[var(--spacing-5)]">Review {productName}</h3>

      <form onSubmit={handleSubmit} noValidate>
        {/* Star picker */}
        <div className="mb-[var(--spacing-5)]">
          <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
            Your Rating{' '}
            <span aria-hidden="true" className="text-[var(--color-error)]">
              *
            </span>
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Name */}
        <div className="mb-[var(--spacing-4)]">
          <label
            htmlFor={`review-name-${productId}`}
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            Your Name{' '}
            <span aria-hidden="true" className="text-[var(--color-error)]">
              *
            </span>
          </label>
          <input
            id={`review-name-${productId}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya S."
            autoComplete="name"
            className={inputClass}
          />
        </div>

        {/* Review text */}
        <div className="mb-[var(--spacing-5)]">
          <label
            htmlFor={`review-body-${productId}`}
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            Your Review{' '}
            <span className="font-normal text-[var(--color-earth-400)]">(optional)</span>
          </label>
          <textarea
            id={`review-body-${productId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={`Share your experience with ${productName}…`}
            className={inputClass}
          />
        </div>

        {/* Error */}
        {state === 'error' && errorMsg && (
          <p
            role="alert"
            className="mb-[var(--spacing-4)] text-[var(--font-size-sm)] text-[var(--color-error)]"
          >
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full h-11 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-700)] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
        >
          {state === 'loading' ? (
            <span
              className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            'Submit Review'
          )}
        </button>

        <p className="mt-[var(--spacing-3)] text-center text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
          Reviews are moderated before appearing publicly.
        </p>
      </form>
    </div>
  );
}
