'use client';

/**
 * app/global-error.tsx (A8-T1-6)
 *
 * Root-level error boundary — catches errors in the root layout itself.
 * Must render its own <html> and <body> since the root layout has failed.
 */

import { useEffect } from 'react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: '#faf7f0',
          fontFamily: 'Arial, sans-serif',
          color: '#3a1f12',
        }}
      >
        <p style={{ fontSize: '4rem', marginBottom: '1rem' }} aria-hidden="true">
          🏺
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
          Critical Error
        </h1>
        <p style={{ fontSize: '1rem', color: '#8b5230', marginBottom: '2rem', maxWidth: '36rem' }}>
          Something went wrong at the application level. Please try refreshing the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            background: '#b65e3c',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Try Again
        </button>
        {error.digest && (
          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#a8683a' }}>
            Reference: <code>{error.digest}</code>
          </p>
        )}
      </body>
    </html>
  );
}
