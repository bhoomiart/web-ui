/**
 * /admin/login — Admin sign-in page.
 *
 * Uses Supabase Auth email+password.
 * On success, proxy.ts redirects to /admin/dashboard.
 *
 * This page is OUTSIDE the AdminShell layout (it has no sidebar).
 * It needs its own root layout treatment — but since it's under (admin)/,
 * the AdminShell still wraps it. We override visually by rendering a
 * centred standalone card instead of relying on sidebar layout.
 */

import { LoginForm } from './LoginForm';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login — Bhoomi Art',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-earth-50)] px-[var(--spacing-4)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-[var(--spacing-8)]">
          <Image
            src="/logo-icon.png"
            alt="Bhoomi Art"
            width={48}
            height={48}
            className="w-12 h-12 object-contain mb-[var(--spacing-3)]"
            priority
          />
          <h1
            className="text-[var(--font-size-xl)] font-bold text-[var(--color-earth-900)]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Bhoomi Art
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] mt-1">
            Admin Dashboard
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card)] p-[var(--spacing-8)]">
          <h2 className="heading-5 mb-[var(--spacing-6)]">Sign in</h2>
          <LoginForm />
        </div>

        <p className="text-center text-[var(--font-size-xs)] text-[var(--color-earth-400)] mt-[var(--spacing-6)]">
          Rooted in Earth · Shaped by Hand · Born with Love
        </p>
      </div>
    </div>
  );
}
