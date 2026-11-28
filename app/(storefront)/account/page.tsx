export const instant = false;
/** /account: the customer's profile (name, phone, email). */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = {
  title: 'My Profile',
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div>
      <h1 className="heading-2 mb-[var(--spacing-2)]">My Profile</h1>
      <p className="body-base text-[var(--color-earth-600)] mb-[var(--spacing-8)]">
        Your details, orders and saved addresses in one place.
      </p>
      <Suspense>
        <ProfileForm />
      </Suspense>
    </div>
  );
}
