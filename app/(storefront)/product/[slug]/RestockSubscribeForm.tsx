'use client';

/**
 * RestockSubscribeForm (A5-T4-8 / A4-T5)
 *
 * Shown instead of Add to Cart when product is out_of_stock.
 * Calls POST /api/restock/subscribe.
 */

import React from 'react';
import { trackEvent } from '@/lib/analytics';

interface RestockSubscribeFormProps {
  productId: string;
  productName: string;
  variantId?: string;
}

type State = 'idle' | 'loading' | 'success' | 'error';

export function RestockSubscribeForm({
  productId,
  productName,
  variantId,
}: RestockSubscribeFormProps) {
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState<State>('idle');
  const [message, setMessage] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setState('error');
      setMessage('Phone number is required.');
      return;
    }

    setState('loading');
    setMessage('');

    try {
      const res = await fetch('/api/restock/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId ?? undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          channel: 'whatsapp',
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok && res.status !== 200) {
        setState('error');
        setMessage(data.error ?? 'Something went wrong.');
        return;
      }

      trackEvent('restock_subscribe', { product_id: productId });
      setState('success');
      setMessage(data.message ?? "You're subscribed! We'll notify you when back in stock.");
    } catch {
      setState('error');
      setMessage('Network error — please try again.');
    }
  }

  if (state === 'success') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-[var(--spacing-3)] p-[var(--spacing-6)] rounded-[var(--radius-xl)] text-center"
        style={{ background: 'var(--color-success-light)' }}
      >
        <span className="text-[var(--font-size-3xl)]" aria-hidden="true">
          🔔
        </span>
        <p className="font-semibold text-[var(--color-success)]">{message}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-6)]"
      style={{ background: 'var(--color-earth-50)' }}
    >
      <div className="flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-4)]">
        <span
          className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-error)', background: 'var(--color-error-light)' }}
        >
          Out of Stock
        </span>
      </div>

      <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-1)]">
        Notify Me When Available
      </p>
      <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] mb-[var(--spacing-5)]">
        Leave your WhatsApp number and we&apos;ll message you when &ldquo;{productName}&rdquo; is
        back in stock.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--spacing-3)]">
        <div>
          <label
            htmlFor="restock-phone"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            WhatsApp Number{' '}
            <span aria-hidden="true" className="text-[var(--color-error)]">
              *
            </span>
          </label>
          <input
            id="restock-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
            autoComplete="tel"
            className="w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            aria-describedby={state === 'error' ? 'restock-error' : undefined}
          />
        </div>

        <div>
          <label
            htmlFor="restock-email"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
          >
            Email (optional)
          </label>
          <input
            id="restock-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
          />
        </div>

        {state === 'error' && (
          <p
            id="restock-error"
            role="alert"
            className="text-[var(--font-size-sm)] text-[var(--color-error)]"
          >
            {message}
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
            <>
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Notify Me
            </>
          )}
        </button>
      </form>
    </div>
  );
}
