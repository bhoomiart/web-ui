export const instant = false;
/**
 * /track — Customer order history and tracking
 *
 * Signed-in customers see their orders directly. Guests can look an order up
 * with phone + order number.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackOrderClient } from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false },
};

export default function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="container-brand py-[var(--spacing-12)] max-w-xl mx-auto">
      <h1 className="heading-2 mb-[var(--spacing-2)]">My Orders</h1>
      <p className="body-base text-[var(--color-earth-600)] mb-[var(--spacing-8)]">
        View your orders, track their status, and request returns.
      </p>
      <Suspense>
        <TrackOrderClient searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
