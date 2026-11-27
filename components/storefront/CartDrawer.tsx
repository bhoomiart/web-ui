'use client';

/**
 * CartDrawer (A6-T1-2)
 *
 * Slide-out cart panel. Opens from the right via a backdrop + side panel.
 * Shows line items with qty controls, subtotal, and a link to /checkout.
 * Availability revalidation happens at checkout open (A6-T1-3).
 */

import { trackEvent } from '@/lib/analytics';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQty, removeItem, itemCount, subtotal } = useCartStore();
  const count = itemCount();
  const total = subtotal();

  // Keyboard close
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-index-modal)] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-brand-charcoal)]/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white shadow-[var(--shadow-modal)] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-4)] border-b border-[var(--color-earth-100)]">
          <h2 className="heading-5">
            Your Cart
            {count > 0 && (
              <span className="ml-[var(--spacing-2)] text-[var(--color-brand-primary)]">
                ({count})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-earth-500)] hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-800)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-[var(--spacing-5)] py-[var(--spacing-4)]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-[var(--spacing-4)] py-[var(--spacing-16)] text-center">
              <svg
                aria-hidden="true"
                className="w-12 h-12 text-[var(--color-earth-200)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1)]">
                  Your cart is empty
                </p>
                <p className="body-small">Add some beautiful pieces to get started.</p>
              </div>
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
              >
                Browse the Shop
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-earth-100)]" role="list">
              {items.map((item) => (
                <li key={item.key} className="flex gap-[var(--spacing-3)] py-[var(--spacing-4)]">
                  {/* Thumbnail */}
                  <Link href={`/product/${item.slug}`} onClick={onClose} className="shrink-0">
                    <div className="w-16 h-16 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-earth-100)]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
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
                      href={`/product/${item.slug}`}
                      onClick={onClose}
                      className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] hover:text-[var(--color-brand-primary)] transition-colors leading-tight block truncate"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mt-0.5">
                        {item.variantName}
                      </p>
                    )}
                    <p
                      className="text-[var(--font-size-sm)] font-bold mt-[var(--spacing-1)]"
                      style={{ color: 'var(--color-brand-primary)' }}
                    >
                      {fmt(item.price)}
                    </p>

                    {/* Qty controls + remove */}
                    <div className="flex items-center gap-[var(--spacing-3)] mt-[var(--spacing-2)]">
                      <div className="inline-flex items-center border border-[var(--color-earth-200)] rounded-[var(--radius-sm)] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQty(item.key, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-[var(--color-earth-600)] hover:bg-[var(--color-earth-100)] transition-colors focus-visible:outline-none"
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
                        <span className="w-8 text-center text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-900)] select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-[var(--color-earth-600)] hover:bg-[var(--color-earth-100)] transition-colors focus-visible:outline-none"
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
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent('remove_from_cart', {
                            product_id: item.productId,
                            product_name: item.name,
                          });
                          removeItem(item.key);
                        }}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] hover:text-[var(--color-error)] transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <p className="shrink-0 text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)] self-start">
                    {fmt(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--color-earth-100)] px-[var(--spacing-5)] py-[var(--spacing-5)] flex flex-col gap-[var(--spacing-4)]">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                Subtotal
              </span>
              <span
                className="text-[var(--font-size-lg)] font-bold"
                style={{ color: 'var(--color-brand-primary)' }}
              >
                {fmt(total)}
              </span>
            </div>
            <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
              Shipping calculated at checkout.
            </p>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-[var(--spacing-2)] h-11 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
            >
              Proceed to Checkout
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h10m-4-4l4 4-4 4" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="text-center text-[var(--font-size-sm)] text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
