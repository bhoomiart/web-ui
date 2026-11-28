'use client';

/**
 * CartLine
 *
 * One cart line: image, name, variant, unit price, quantity stepper, remove,
 * line total, and the stock status for that line.
 *
 * Used by the cart drawer today and reusable for a full /cart page.
 * Presentational: the parent supplies the actions.
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/lib/store/cartStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

interface CartLineProps {
  item: CartItem;
  /** A request for this line is in flight */
  busy?: boolean;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  /** Called when a link inside the line is followed (closes the drawer) */
  onNavigate?: () => void;
}

export function CartLine({ item, busy = false, onQuantity, onRemove, onNavigate }: CartLineProps) {
  const status = item.status ?? 'ok';
  const unbuyable = status === 'out_of_stock' || status === 'unavailable';
  const atMax = item.availableQty != null && item.maxQty != null && item.quantity >= item.maxQty;
  const messageId = `cart-line-msg-${item.key}`;

  return (
    <li
      className={`flex gap-[var(--spacing-3)] py-[var(--spacing-4)] ${unbuyable ? 'bg-[var(--color-error-light)]/30 -mx-[var(--spacing-2)] px-[var(--spacing-2)] rounded-[var(--radius-md)]' : ''}`}
    >
      {/* Thumbnail */}
      <Link
        href={item.slug ? `/product/${item.slug}` : '/shop'}
        onClick={onNavigate}
        className="shrink-0"
        aria-label={`View ${item.name}`}
      >
        <div
          className={`relative w-16 h-16 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-earth-100)] ${unbuyable ? 'opacity-60 grayscale' : ''}`}
        >
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-earth-300)]">
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={item.slug ? `/product/${item.slug}` : '/shop'}
          onClick={onNavigate}
          className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] hover:text-[var(--color-brand-primary)] transition-colors leading-tight block truncate py-0.5"
        >
          {item.name}
        </Link>
        {item.variantName && (
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)] mt-0.5">
            {item.variantName}
          </p>
        )}
        {!unbuyable && (
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)] mt-[var(--spacing-1)]">
            {fmt(item.price)} each
          </p>
        )}

        {/* Stock status for this line */}
        <div id={messageId} role="status" aria-live="polite">
          {status === 'low_stock' && (
            <p
              className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] font-semibold"
              style={{ color: 'var(--color-warning-dark)' }}
            >
              {item.message ?? `Only ${item.availableQty} left in stock`}
            </p>
          )}
          {status === 'adjusted' && (
            <p
              className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] font-semibold"
              style={{ color: 'var(--color-warning-dark)' }}
            >
              {item.message}
            </p>
          )}
          {status === 'out_of_stock' && (
            <p
              className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] font-bold"
              style={{ color: 'var(--color-error)' }}
            >
              Out of Stock. Remove it to continue.
            </p>
          )}
          {status === 'unavailable' && (
            <p
              className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] font-bold"
              style={{ color: 'var(--color-error)' }}
            >
              {item.message ?? 'No longer available.'} Remove it to continue.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-[var(--spacing-3)] mt-[var(--spacing-2)]">
          {!unbuyable && (
            <div
              className="inline-flex items-center border border-[var(--color-earth-200)] rounded-[var(--radius-sm)] overflow-hidden"
              role="group"
              aria-label={`Quantity of ${item.name}`}
              aria-describedby={messageId}
            >
              <button
                type="button"
                onClick={() => onQuantity(item.key, item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                aria-label={`Decrease quantity of ${item.name}`}
                className="w-8 h-8 flex items-center justify-center text-[var(--color-earth-600)] hover:bg-[var(--color-earth-100)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
              >
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" d="M2 6h8" />
                </svg>
              </button>
              <span
                className="w-8 text-center text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] select-none"
                aria-live="polite"
              >
                {busy ? (
                  <span
                    aria-hidden="true"
                    className="inline-block w-3 h-3 rounded-full border-2 border-[var(--color-earth-300)] border-t-[var(--color-brand-primary)] animate-spin align-middle"
                  />
                ) : (
                  item.quantity
                )}
                {busy && <span className="sr-only">Updating</span>}
              </span>
              <button
                type="button"
                onClick={() => onQuantity(item.key, item.quantity + 1)}
                disabled={busy || atMax}
                aria-label={`Increase quantity of ${item.name}`}
                title={atMax ? `Only ${item.maxQty} available` : undefined}
                className="w-8 h-8 flex items-center justify-center text-[var(--color-earth-600)] hover:bg-[var(--color-earth-100)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
              >
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                </svg>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            disabled={busy}
            aria-label={`Remove ${item.name} from cart`}
            className={`text-[var(--font-size-xs)] transition-colors focus-visible:outline-none focus-visible:underline disabled:opacity-50 ${
              unbuyable
                ? 'px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] border border-[var(--color-error)] font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white'
                : 'text-[var(--color-earth-600)] hover:text-[var(--color-error)]'
            }`}
          >
            Remove
          </button>
        </div>
        {atMax && !unbuyable && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
            Maximum available
          </p>
        )}
      </div>

      {/* Line total */}
      <p className="shrink-0 text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)] self-start">
        {unbuyable ? '—' : fmt(item.price * item.quantity)}
      </p>
    </li>
  );
}
