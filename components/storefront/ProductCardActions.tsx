'use client';

/**
 * ProductCardActions
 *
 * Quick add-to-cart under a product card, with live stock:
 *   - "Only N left in stock" when fewer than 5 remain
 *   - disabled "Out of Stock" when none remain
 *   - "Choose options" (link) for products with variants
 *
 * Stock for every card on a page is loaded in one batched request
 * (lib/cart/stockClient.ts). Adding is validated on the server regardless of
 * what is shown here.
 */

import * as React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { trackEvent } from '@/lib/analytics';
import { LOW_STOCK_DISPLAY_THRESHOLD, MAX_LINE_QTY } from '@/lib/cart/constants';
import { cartLineKey } from '@/lib/cart/types';
import { refreshStock, useProductStock } from '@/lib/cart/stockClient';

export interface QuickAddProduct {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image: string | null;
  availabilityType: string;
}

const baseButton =
  'w-full h-9 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] border text-[var(--font-size-sm)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2';

export function ProductCardActions({ product }: { product: QuickAddProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const stock = useProductStock(product.id);
  const inCart = useCartStore(
    (s) => s.items.find((i) => i.key === cartLineKey(product.id, null))?.quantity ?? 0
  );
  const [phase, setPhase] = React.useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  if (product.price == null) return null;

  const explicitlyOut = product.availabilityType === 'out_of_stock';
  const available = stock?.availableQty; // number | null | undefined
  const limited = typeof available === 'number';
  const soldOut = explicitlyOut || available === 0;
  const lowStock = !soldOut && limited && available < LOW_STOCK_DISPLAY_THRESHOLD;
  const remaining = limited ? Math.max(0, available - inCart) : MAX_LINE_QTY - inCart;
  const allInCart = !soldOut && limited && remaining === 0;

  async function handleAdd() {
    if (phase === 'adding' || soldOut || allInCart) return;
    setError(null);
    setPhase('adding');

    const result = await addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      variantName: null,
      price: product.price!,
      image: product.image,
      slug: product.slug,
      availabilityType: product.availabilityType,
      quantity: 1,
    });
    void refreshStock(product.id);

    if (!result.ok) {
      setPhase('idle');
      setError(result.message ?? 'Could not add to cart.');
      return;
    }

    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      value: product.price!,
      currency: 'INR',
    });
    setPhase('added');
    setTimeout(() => setPhase((p) => (p === 'added' ? 'idle' : p)), 1800);
  }

  // Variant products need an option chosen, so send the shopper to the product page.
  if (stock?.hasVariants && !soldOut) {
    return (
      <div className="mt-[var(--spacing-2)]">
        <Link
          href={`/product/${product.slug}`}
          className={`${baseButton} border-[var(--color-earth-300)] text-[var(--color-earth-800)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]`}
        >
          Choose options
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-[var(--spacing-2)] flex flex-col gap-[var(--spacing-1)]">
      {lowStock && (
        <p
          className="text-[var(--font-size-xs)] font-semibold"
          style={{ color: 'var(--color-warning-dark)' }}
        >
          Only {available} left in stock
        </p>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut || allInCart || phase === 'adding'}
        // The accessible name starts with the visible text (WCAG "label in name") and adds the product.
        aria-label={
          soldOut
            ? `Out of Stock: ${product.name}`
            : allInCart
              ? `Max in cart: all available units of ${product.name} are in your cart`
              : `Add to Cart: ${product.name}`
        }
        className={`${baseButton} ${
          soldOut || allInCart
            ? 'border-[var(--color-earth-200)] bg-[var(--color-earth-100)] text-[var(--color-earth-600)] cursor-not-allowed'
            : phase === 'added'
              ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
              : 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-white'
        }`}
      >
        {soldOut ? (
          'Out of Stock'
        ) : allInCart ? (
          'Max in cart'
        ) : phase === 'adding' ? (
          <>
            <span
              aria-hidden="true"
              className="w-3.5 h-3.5 rounded-full border-2 border-current/40 border-t-current animate-spin"
            />
            Checking…
          </>
        ) : phase === 'added' ? (
          'Added ✓'
        ) : (
          'Add to Cart'
        )}
      </button>

      {error && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
