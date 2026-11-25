'use client';

/**
 * AddToCartSection (A5-T4-5, A5-T4-6, A5-T4-7)
 *
 * Client component that renders:
 *   - Variant selector (if variants exist)
 *   - Quantity selector
 *   - Add to Cart button
 *
 * Cart store integration wired in A6-T1. For now the button is fully
 * functional in terms of UI state but cart persistence is a no-op stub.
 */

import React from 'react';

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
}

export function AddToCartSection({ product, variants }: AddToCartSectionProps) {
  const activeVariants = variants.filter((v) => v.status === 'active' || v.status === 'available');
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    activeVariants[0]?.id ?? null
  );
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice =
    product.price != null ? product.price + (selectedVariant?.price_modifier ?? 0) : null;

  const isOutOfStock = product.availability_type === 'out_of_stock';

  function handleAddToCart() {
    // TODO: wire to useCartStore().addItem() in A6-T1
    // For now, show a brief visual confirmation
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-[var(--spacing-5)]">
      {/* Variant selector */}
      {activeVariants.length > 0 && (
        <div>
          <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
            Variant
          </p>
          <div className="flex flex-wrap gap-[var(--spacing-2)]">
            {activeVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                aria-pressed={selectedVariantId === v.id}
                className={`px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-md)] border text-[var(--font-size-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                  selectedVariantId === v.id
                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                    : 'border-[var(--color-earth-200)] text-[var(--color-earth-700)] hover:border-[var(--color-brand-primary)]'
                }`}
              >
                {v.name}
                {v.price_modifier !== 0 && (
                  <span className="ml-1 opacity-70">
                    ({v.price_modifier > 0 ? '+' : ''}
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(v.price_modifier)}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price update with variant */}
      {selectedVariant && selectedVariant.price_modifier !== 0 && effectivePrice != null && (
        <p
          className="text-[var(--font-size-2xl)] font-bold"
          style={{ color: 'var(--color-brand-primary)' }}
        >
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(effectivePrice)}
        </p>
      )}

      {/* Quantity selector */}
      <div>
        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
          Quantity
        </p>
        <div className="inline-flex items-center border border-[var(--color-earth-200)] rounded-[var(--radius-md)] overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
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
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
            className="w-10 h-10 flex items-center justify-center text-[var(--color-earth-700)] hover:bg-[var(--color-earth-100)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
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
      </div>

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        aria-disabled={isOutOfStock}
        className={`w-full flex items-center justify-center gap-[var(--spacing-3)] h-12 rounded-[var(--radius-button)] font-bold text-[var(--font-size-base)] transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 ${
          added
            ? 'bg-[var(--color-success)] text-white'
            : isOutOfStock
              ? 'bg-[var(--color-earth-200)] text-[var(--color-earth-500)] cursor-not-allowed'
              : 'bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-earth-700)] shadow-[var(--shadow-button)]'
        }`}
      >
        {added ? (
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
