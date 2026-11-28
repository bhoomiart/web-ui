export const instant = false;
/**
 * /account/addresses: the customer's saved delivery addresses.
 * Signed-out visitors are asked to sign in. Data comes from /api/addresses.
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AddressBook } from './AddressBook';

export const metadata: Metadata = {
  title: 'Saved Addresses',
  robots: { index: false },
};

export default function AddressesPage() {
  return (
    <div>
      <h1 className="heading-2 mb-[var(--spacing-2)]">Saved Addresses</h1>
      <p className="body-base text-[var(--color-earth-600)] mb-[var(--spacing-8)]">
        Save your delivery addresses once and pick one at checkout.
      </p>
      <Suspense>
        <AddressBook />
      </Suspense>
    </div>
  );
}
