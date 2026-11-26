'use client';

/**
 * app/error.tsx (A8-T1-6)
 *
 * Global error boundary for the App Router.
 * Renders when an unhandled error propagates to the root error boundary.
 * Must be a Client Component (required by Next.js).
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error tracking service in production
    // e.g. Sentry.captureException(error)
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-[var(--spacing-6)] py-[var(--spacing-16)] text-center"
      style={{ background: 'var(--color-brand-ivory)' }}
    >
      <p className="text-[var(--font-size-5xl)] mb-[var(--spacing-4)]" aria-hidden="true">
        🏺
      </p>

      <h1 className="heading-2 mb-[var(--spacing-4)]">Something went wrong</h1>
      <p className="body-large text-[var(--color-earth-600)] mb-[var(--spacing-8)] max-w-md">
        An unexpected error occurred. We&apos;ve been notified and are looking into it.
      </p>

      <div className="flex flex-wrap justify-center gap-[var(--spacing-4)]">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Go Home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-[var(--spacing-8)] caption">
          Error reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
