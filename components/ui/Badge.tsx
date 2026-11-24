import * as React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const BASE =
  'inline-flex items-center gap-1.5 ' +
  'rounded-[var(--radius-badge)] border px-2.5 py-0.5 ' +
  'text-[var(--font-size-xs)] font-semibold leading-none ';

const VARIANTS: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--color-earth-100)] text-[var(--color-earth-700)] ' +
    'border-[var(--color-earth-200)]',

  success:
    'bg-[var(--color-success-light)] text-[var(--color-success-dark)] ' +
    'border-[var(--color-success-light)]',

  warning:
    'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] ' +
    'border-[var(--color-warning-light)]',

  error:
    'bg-[var(--color-error-light)] text-[var(--color-error-dark)] ' +
    'border-[var(--color-error-light)]',

  info:
    'bg-[var(--color-info-light)] text-[var(--color-info-dark)] ' +
    'border-[var(--color-info-light)]',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-earth-500)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-info)]',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({
  variant = 'default',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {dot && (
        <span
          className={`block h-1.5 w-1.5 rounded-full ${DOT_COLORS[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
