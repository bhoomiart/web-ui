'use client';

/**
 * StockAdjustClient
 *
 * Thin client wrapper that owns the modal open/close state and triggers
 * a full page refresh after a successful stock adjustment.
 *
 * Lives as a separate client component so the parent inventory page
 * can remain a Server Component.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { StockAdjustModal } from './StockAdjustModal';

interface StockAdjustClientProps {
  inventoryId: string;
  productName: string;
  availableStock: number;
}

export function StockAdjustClient({
  inventoryId,
  productName,
  availableStock,
}: StockAdjustClientProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          'inline-flex items-center gap-1 px-[var(--spacing-3)] py-[var(--spacing-1)] ' +
          'rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-semibold ' +
          'border border-[var(--color-earth-200)] text-[var(--color-earth-700)] ' +
          'bg-white hover:border-[var(--color-brand-primary)] ' +
          'hover:text-[var(--color-brand-primary)] ' +
          'transition-colors focus-visible:outline-none ' +
          'focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]'
        }
        aria-label={`Adjust stock for ${productName}`}
      >
        <svg
          aria-hidden="true"
          className="w-3 h-3"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        Adjust
      </button>

      <StockAdjustModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        inventoryId={inventoryId}
        productName={productName}
        availableStock={availableStock}
      />
    </>
  );
}
