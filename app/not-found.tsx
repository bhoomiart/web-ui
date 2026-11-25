/**
 * 404 — Not Found
 *
 * Brand-styled 404 page. Lives at app/not-found.tsx so it applies globally
 * (both storefront and admin will use it, but admin has its own redirect logic).
 * Does not use the storefront layout (no Navbar/Footer outside the route group).
 * Uses minimal inline styles consistent with the design tokens.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-[var(--spacing-6)] py-[var(--spacing-16)] text-center"
      style={{ background: 'var(--color-brand-ivory)' }}
    >
      {/* Number */}
      <p
        className="font-serif font-extrabold leading-none select-none mb-[var(--spacing-6)]"
        style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          color: 'var(--color-earth-200)',
        }}
        aria-hidden="true"
      >
        404
      </p>

      {/* Headline */}
      <h1 className="heading-2 mb-[var(--spacing-4)]">Page Not Found</h1>
      <p className="body-large text-[var(--color-earth-600)] mb-[var(--spacing-10)] max-w-md">
        This page seems to have wandered off — a bit like a pot that slipped out of the kiln.
        Let&apos;s get you back to something beautiful.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-[var(--spacing-4)]">
        <Link
          href="/"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Browse the Shop
        </Link>
      </div>

      {/* Brand signature */}
      <p className="brand-signature mt-[var(--spacing-16)]">Bhoomi Art · Rooted in Earth</p>
    </div>
  );
}
