export const instant = false;
/**
 * /track — Customer order tracking (A6-T3-3, A6-T3-4)
 *
 * No login required. Customer enters phone + order number.
 * Shows full order status timeline.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackOrderClient } from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Your Order — Bhoomi Art',
  robots: { index: false },
};

export default function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="container-brand py-[var(--spacing-12)] max-w-xl mx-auto">
      <h1 className="heading-2 mb-[var(--spacing-2)]">Track Your Order</h1>
      <p className="body-base text-[var(--color-earth-600)] mb-[var(--spacing-8)]">
        Enter your phone number and order number to see your order status.
      </p>
      <Suspense>
        <TrackOrderClient searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
