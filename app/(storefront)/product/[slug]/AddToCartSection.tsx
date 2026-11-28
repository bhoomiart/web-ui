'use client';

/**
 * AddToCartSection (A5-T4-5/6/7, stock-aware in A10-T3)
 *
 * Variant selector + quantity stepper + Add to Cart button.
 *
 * Stock rules shown to the shopper:
 *   - available < 5            -> "Only N left in stock" badge
 *   - available = 0            -> "Out of Stock", button disabled
 *   - stepper never goes above what is left after what is already in the cart
 *
 * The page renders initial stock on the server; this component keeps it live
 * (refetch on tab focus and after every add). The server still re-checks every
 * add, so a stale number here can never oversell.
 */

import React from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { trackEvent } from '@/lib/analytics';
import { LOW_STOCK_DISPLAY_THRESHOLD, MAX_LINE_QTY } from '@/lib/cart/constants';
import { cartLineKey, type StockInfo } from '@/lib/cart/types';
import { refreshStock, useProductStock } from '@/lib/cart/stockClient';

interface Variant {
  id: string;
  name: string;
  sku: string | null;
  price_modifier: number;
  attributes: unknown;
  status: string;
}

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  availability_type: string;
  image: string | null;
}

interface AddToCartSectionProps {
  product: ProductInfo;
  variants: Variant[];
  initialStock?: StockInfo | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

type Phase = 'idle' | 'adding' | 'added';

export function AddToCartSection({ product, variants, initialStock }: AddToCartSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const stock = useProductStock(product.id, initialStock, true);

  const activeVariants = variants.filter((v) => v.status === 'active' || v.status === 'available');

  /** Units available for a variant (or the base product). undefined = not known yet. */
  const availableFor = React.useCallback(
    (variantId: string | null): number | null | undefined => {
      if (!stock) return undefined;
      if (variantId) return variantId in stock.variants ? stock.variants[variantId] : 0;
      return stock.availableQty;
    },
    [stock]
  );

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(() => {
    // Start on the first variant that is actually in stock.
    const inStock = activeVariants.find((v) => {
      const q = initialStock?.variants?.[v.id];
      return q === undefined || q === null || q > 0;
    });
    return (inStock ?? activeVariants[0])?.id ?? null;
  });
  const [quantity, setQuantity] = React.useState(1);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice =
    product.price != null ? product.price + (selectedVariant?.price_modifier ?? 0) : null;

  const lineKey = cartLineKey(product.id, selectedVariant?.id ?? null);
  const inCart = useCartStore((s) => s.items.find((i) => i.key === lineKey)?.quantity ?? 0);

  const available = availableFor(selectedVariant?.id ?? null); // number | null | undefined
  const limited = typeof available === 'number';
  const soldOut = available === 0;
  /** How many more can still be added on top of what is in the cart */
  const remaining = limited
    ? Math.max(0, Math.min(available, MAX_LINE_QTY) - inCart)
    : Math.max(0, MAX_LINE_QTY - inCart);
  const lowStock = limited && available > 0 && available < LOW_STOCK_DISPLAY_THRESHOLD;
  const allInCart = limited && available > 0 && remaining === 0;

  // Keep the chosen quantity inside what is available (variant switch, stock change, cart change).
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantity((q) => Math.max(1, Math.min(q, Math.max(1, remaining))));
  }, [remaining]);

  async function handleAddToCart() {
    if (effectivePrice == null || soldOut || allInCart || phase === 'adding') return;
    setError(null);
    setPhase('adding');

    const result = await addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      variantName: selectedVariant?.name ?? null,
      price: effectivePrice,
      image: product.image,
      slug: product.slug,
      availabilityType: product.availability_type,
      quantity,
    });

    // Whatever happened, show the real stock now.
    void refreshStock(product.id);

    if (!result.ok) {
      setPhase('idle');
      setError(result.message ?? 'Could not add this item to your cart.');
      return;
    }

    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      variant_id: selectedVariant?.id,
      quantity,
      value: effectivePrice * quantity,
      currency: 'INR',
    });
    setQuantity(1);
    setPhase('added');
    setTimeout(() => setPhase((p) => (p === 'added' ? 'idle' : p)), 2000);
  }

  const buttonDisabled = effectivePrice == null || soldOut || allInCart || phase === 'adding';
  const stepperMax = Math.max(1, remaining);

  return (
    <div className="flex flex-col gap-[var(--spacing-5)]">
      {/* Variant selector */}
      {activeVariants.length > 0 && (
        <div>
          <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
            Variant
          </p>
          <div className="flex flex-wrap gap-[var(--spacing-2)]" role="group" aria-label="Variant">
            {activeVariants.map((v) => {
              const q = availableFor(v.id);
              const out = q === 0;
              const selected = selectedVariantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setError(null);
                  }}
                  aria-pressed={selected}
                  title={out ? 'Out of stock' : undefined}
                  className={`px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border text-[var(--font-size-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                    selected
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                      : out
                        ? 'border-[var(--color-earth-200)] text-[var(--color-earth-600)] line-through hover:border-[var(--color-earth-300)]'
                        : 'border-[var(--color-earth-200)] text-[var(--color-earth-700)] hover:border-[var(--color-brand-primary)]'
                  }`}
                >
                  {v.name}
                  {v.price_modifier !== 0 && (
                    <span className="ml-1 opacity-70">
                      ({v.price_modifier > 0 ? '+' : ''}
                      {fmt(v.price_modifier)})
                    </span>
                  )}
                  {out && <span className="sr-only"> (out of stock)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Effective price when variant changes it */}
      {selectedVariant && selectedVariant.price_modifier !== 0 && effectivePrice != null && (
        <p
          className="text-[var(--font-size-2xl)] font-bold"
          style={{ color: 'var(--color-brand-primary)' }}
        >
          {fmt(effectivePrice)}
        </p>
      )}

      {/* Stock status */}
      <div
        aria-live="polite"
        className="flex flex-wrap items-center gap-[var(--spacing-2)] min-h-6"
      >
        {soldOut && (
          <span
            className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-error)', background: 'var(--color-error-light)' }}
          >
            Out of Stock
          </span>
        )}
        {lowStock && (
          <span
            className="inline-flex items-center gap-1 px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold"
            style={{ color: 'var(--color-warning-dark)', background: 'var(--color-warning-light)' }}
          >
            <span aria-hidden="true">●</span>
            Only {available} left in stock
          </span>
        )}
        {inCart > 0 && !soldOut && (
          <span className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
            {inCart} in your cart
          </span>
        )}
      </div>

      {/* Quantity */}
      <div>
        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
          Quantity
        </p>
        <div className="inline-flex items-center border border-[var(--color-earth-200)] rounded-[var(--radius-md)] overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || soldOut}
            aria-label="Decrease quantity"
            className="w-10 h-10 flex items-center justify-center text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M3 8h10" />
            </svg>
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="w-12 text-center text-[var(--font-size-base)] font-semibold text-[var(--color-earth-900)] select-none"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stepperMax, q + 1))}
            disabled={quantity >= stepperMax || soldOut || allInCart}
            aria-label="Increase quantity"
            title={quantity >= stepperMax && limited ? `Only ${available} available` : undefined}
            className="w-10 h-10 flex items-center justify-center text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>
        {limited && quantity >= stepperMax && !soldOut && !allInCart && remaining > 0 && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
            That&apos;s all we have{inCart > 0 ? ' beyond what is in your cart' : ''}.
          </p>
        )}
        {allInCart && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
            You have all {available} available units in your cart.
          </p>
        )}
      </div>

      {/* Inline error from the server */}
      {error && (
        <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
          {error}
        </p>
      )}

      {/* Add to Cart */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={buttonDisabled}
        aria-disabled={buttonDisabled}
        className={`w-full flex items-center justify-center gap-[var(--spacing-3)] h-12 rounded-[var(--radius-button)] font-bold text-[var(--font-size-base)] transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 ${
          phase === 'added'
            ? 'bg-[var(--color-success)] text-white'
            : buttonDisabled
              ? 'bg-[var(--color-earth-200)] text-[var(--color-earth-600)] cursor-not-allowed'
              : 'bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-earth-700)] shadow-[var(--shadow-button)]'
        }`}
      >
        {phase === 'added' ? (
          <>
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3.5 3.5L15 7" />
            </svg>
            Added to Cart
          </>
        ) : phase === 'adding' ? (
          <>
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            />
            Checking stock…
          </>
        ) : soldOut ? (
          'Out of Stock'
        ) : allInCart ? (
          'All available units in cart'
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
