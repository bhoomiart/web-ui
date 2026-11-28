export const instant = false;
/**
 * /account/orders: the signed-in customer's order history (track, review, return).
 * Reuses the /track client, which also offers the phone + order number lookup for
 * guest orders when signed out.
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackOrderClient } from '../../track/TrackOrderClient';

export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false },
};

export default function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div>
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
