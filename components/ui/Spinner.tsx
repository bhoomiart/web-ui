import * as React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Screen-reader label. Defaults to "Loading…" */
  label?: string;
  className?: string;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <span
        aria-hidden="true"
        className={
          `${SIZES[size]} rounded-full ` +
          'border-[var(--color-earth-200)] ' +
          'border-t-[var(--color-brand-primary)] ' +
          'animate-spin'
        }
      />
      {/* Visually hidden text for context beyond just the aria-label */}
      <span className="sr-only">{label}</span>
    </span>
  );
}

Spinner.displayName = 'Spinner';
