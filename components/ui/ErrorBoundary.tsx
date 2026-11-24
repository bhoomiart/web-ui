'use client';

import * as React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback. If omitted, the built-in branded fallback is shown. */
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Wire up to real error tracking (e.g. Sentry) when available
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;

    if (typeof fallback === 'function') {
      return fallback(error, this.reset);
    }

    if (fallback !== undefined) {
      return fallback;
    }

    return <DefaultFallback error={error} reset={this.reset} />;
  }
}

// ─── Default fallback UI ─────────────────────────────────────────────────────

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      role="alert"
      className={
        'flex flex-col items-center justify-center gap-[var(--spacing-4)] ' +
        'rounded-[var(--radius-card)] border border-[var(--color-error-light)] ' +
        'bg-[var(--color-error-light)] px-[var(--spacing-8)] py-[var(--spacing-12)] ' +
        'text-center'
      }
    >
      {/* Icon */}
      <span aria-hidden="true" className="text-[var(--color-error)]">
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </span>

      <div className="flex flex-col gap-[var(--spacing-1)]">
        <p className="text-[var(--font-size-base)] font-semibold text-[var(--color-error-dark)]">
          Something went wrong
        </p>
        <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">
          {error.message || 'An unexpected error occurred.'}
        </p>
      </div>

      <button
        type="button"
        onClick={reset}
        className={
          'rounded-[var(--radius-button)] border border-[var(--color-error)] ' +
          'bg-transparent px-[var(--spacing-5)] py-[var(--spacing-2)] ' +
          'text-[var(--font-size-sm)] font-semibold text-[var(--color-error-dark)] ' +
          'transition-colors duration-[var(--duration-fast)] ' +
          'hover:bg-[var(--color-error)] hover:text-white ' +
          'focus-visible:outline-none focus-visible:ring-2 ' +
          'focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2'
        }
      >
        Try again
      </button>
    </div>
  );
}
