'use client';

/**
 * CartDrawer (A6-T1-2, rebuilt in A10-T4)
 *
 * Slide-out cart panel.
 *   - Re-checks every line against live stock and prices when it opens, and
 *     every minute while open.
 *   - Each line shows its own stock status (low stock, reduced, sold out).
 *   - "Proceed to Checkout" re-validates first and is blocked until every line
 *     can be bought as requested.
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import { CartLine } from './CartLine';

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

const REFRESH_WHILE_OPEN_MS = 60_000;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const pending = useCartStore((s) => s.pending);
  const syncing = useCartStore((s) => s.syncing);
  const totals = useCartStore((s) => s.totals);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const syncWithServer = useCartStore((s) => s.syncWithServer);

  // Derived from items, so they re-render with them.
  const count = items.reduce(
    (n, i) => (i.status === 'out_of_stock' || i.status === 'unavailable' ? n : n + i.quantity),
    0
  );
  const subtotal = items.reduce(
    (n, i) =>
      i.status === 'out_of_stock' || i.status === 'unavailable' ? n : n + i.price * i.quantity,
    0
  );
  const issues = items.filter((i) => {
    const st = i.status ?? 'ok';
    return st === 'out_of_stock' || st === 'unavailable' || st === 'adjusted';
  });
  const blocking = items.filter((i) => i.status === 'out_of_stock' || i.status === 'unavailable');
  // Sold-out or unavailable lines block checkout. A reduced quantity does not: it is already
  // fixed and shown, and clicking Checkout re-validates before leaving the cart.
  const canTryCheckout = items.length > 0 && blocking.length === 0;

  const [checking, setChecking] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);

  // Re-check stock and prices when opened, then every minute while open.
  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckoutError(null);
    void syncWithServer({ force: true, notify: true });
    const id = setInterval(
      () => void syncWithServer({ force: true, notify: true }),
      REFRESH_WHILE_OPEN_MS
    );
    return () => clearInterval(id);
  }, [open, syncWithServer]);

  // Keyboard: Escape closes, Tab stays inside the panel.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock + focus handling.
  React.useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  async function handleCheckout() {
    setCheckoutError(null);
    setChecking(true);
    try {
      // Fresh stock and prices right before leaving the cart.
      const ok = await syncWithServer({ force: true, notify: true });
      if (!ok) {
        setCheckoutError(
          "We couldn't verify your cart. Please check your connection and try again."
        );
        return;
      }
      if (!useCartStore.getState().isValid()) {
        setCheckoutError(
          'Some items need your attention before you can check out. See the notes above.'
        );
        return;
      }

      // Not signed in: ask here, in a modal, without leaving the page or touching the cart.
      // After signing in the modal sends the shopper on to checkout.
      const { user, ready } = useAuthStore.getState();
      if (ready && !user) {
        onClose();
        useAuthModalStore.getState().open({
          reason: 'Sign in to continue with your checkout',
          redirectTo: '/checkout',
        });
        return;
      }

      trackEvent('checkout_start', { item_count: items.length, value: subtotal, currency: 'INR' });
      onClose();
      router.push('/checkout');
    } finally {
      setChecking(false);
    }
  }

  if (!open) return null;

  const checkoutDisabled = !canTryCheckout || checking || syncing;

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
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-md bg-white shadow-[var(--shadow-modal)] flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-4)] border-b border-[var(--color-earth-100)]">
          <h2 className="heading-5 flex items-center gap-[var(--spacing-2)]">
            Your Cart
            {count > 0 && <span className="text-[var(--color-brand-primary)]">({count})</span>}
            {syncing && (
              <span
                role="status"
                className="inline-flex items-center gap-1 text-[var(--font-size-xs)] font-normal text-[var(--color-earth-600)]"
              >
                <span
                  aria-hidden="true"
                  className="w-3 h-3 rounded-full border-2 border-[var(--color-earth-200)] border-t-[var(--color-brand-primary)] animate-spin"
                />
                Checking availability…
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-earth-600)] hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-800)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
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
            <>
              {issues.length > 0 && (
                <div
                  role="alert"
                  className="mb-[var(--spacing-3)] rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-light)] px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--font-size-sm)]"
                  style={{ color: 'var(--color-warning-dark)' }}
                >
                  <p className="font-semibold">
                    {blocking.length > 0
                      ? `${blocking.length} item${blocking.length > 1 ? 's' : ''} can't be ordered right now.`
                      : 'Some quantities were changed to match stock.'}
                  </p>
                  <p className="text-[var(--font-size-xs)] mt-0.5">
                    {blocking.length > 0
                      ? 'Remove them to continue to checkout.'
                      : 'Review the notes below, then continue.'}
                  </p>
                </div>
              )}
              <ul className="flex flex-col divide-y divide-[var(--color-earth-100)]" role="list">
                {items.map((item) => (
                  <CartLine
                    key={item.key}
                    item={item}
                    busy={pending.includes(item.key)}
                    onQuantity={(key, qty) => void updateQty(key, qty)}
                    onRemove={(key) => {
                      trackEvent('remove_from_cart', {
                        product_id: item.productId,
                        product_name: item.name,
                      });
                      void removeItem(key);
                    }}
                    onNavigate={onClose}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--color-earth-100)] px-[var(--spacing-5)] py-[var(--spacing-5)] flex flex-col gap-[var(--spacing-3)]">
            <dl className="flex flex-col gap-[var(--spacing-1)] text-[var(--font-size-sm)]">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--color-earth-600)]">Subtotal</dt>
                <dd className="font-semibold text-[var(--color-earth-900)]">{fmt(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--color-earth-600)]">Shipping</dt>
                <dd className="text-[var(--color-earth-600)]">
                  {totals && !totals.shippingPending && totals.shippingFee != null
                    ? totals.shippingFee === 0
                      ? 'Free'
                      : fmt(totals.shippingFee)
                    : 'Calculated at checkout'}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-[var(--spacing-2)] mt-[var(--spacing-1)] border-t border-[var(--color-earth-100)]">
                <dt className="font-semibold text-[var(--color-earth-800)]">
                  {totals && !totals.shippingPending ? 'Total' : 'Estimated total'}
                </dt>
                <dd
                  className="text-[var(--font-size-lg)] font-bold"
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  {fmt(
                    totals && !totals.shippingPending && totals.shippingFee != null
                      ? subtotal + totals.shippingFee
                      : subtotal
                  )}
                </dd>
              </div>
            </dl>
            {totals?.freeShippingRemaining != null && totals.freeShippingRemaining > 0 && (
              <p className="text-[var(--font-size-xs)] text-[var(--color-forest-500)]">
                Add {fmt(totals.freeShippingRemaining)} more for free shipping.
              </p>
            )}
            {(!totals || totals.shippingPending) && (
              <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
                Shipping depends on your delivery state. Discounts, if any, are applied at checkout.
              </p>
            )}

            {checkoutError && (
              <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
                {checkoutError}
              </p>
            )}

            {/* Checkout CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutDisabled}
              aria-disabled={checkoutDisabled}
              className="w-full flex items-center justify-center gap-[var(--spacing-2)] h-11 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] disabled:bg-[var(--color-earth-200)] disabled:text-[var(--color-earth-500)] disabled:shadow-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
            >
              {checking ? (
                <>
                  <span
                    aria-hidden="true"
                    className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                  />
                  Checking your cart…
                </>
              ) : (
                <>
                  {blocking.length > 0
                    ? 'Remove unavailable items to continue'
                    : 'Proceed to Checkout'}
                  {canTryCheckout && (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 10h10m-4-4l4 4-4 4"
                      />
                    </svg>
                  )}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-center text-[var(--font-size-sm)] text-[var(--color-earth-600)] hover:text-[var(--color-earth-800)] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
