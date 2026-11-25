/**
 * MetricCard — dashboard stat card.
 * Server component — no interactivity.
 */

import Link from 'next/link';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
  variant?: 'default' | 'warning' | 'error' | 'success';
  sublabel?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  href,
  variant = 'default',
  sublabel,
}: MetricCardProps) {
  const accent: Record<string, string> = {
    default: 'var(--color-brand-primary)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    success: 'var(--color-success)',
  };

  const bg: Record<string, string> = {
    default: 'var(--color-earth-100)',
    warning: 'var(--color-warning-light)',
    error: 'var(--color-error-light)',
    success: 'var(--color-success-light)',
  };

  const content = (
    <div
      className={[
        'relative flex flex-col gap-[var(--spacing-3)]',
        'bg-white rounded-[var(--radius-lg)] p-[var(--spacing-5)]',
        'shadow-[var(--shadow-card)]',
        href ? 'transition-shadow hover:shadow-[var(--shadow-card-hover)] cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Accent bar */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[var(--radius-lg)]"
        style={{ background: accent[variant] }}
      />

      <div className="flex items-start justify-between gap-[var(--spacing-3)]">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] shrink-0"
          style={{ background: bg[variant], color: accent[variant] }}
        >
          {icon}
        </div>

        {/* Value */}
        <span className="text-[var(--font-size-3xl)] font-bold text-[var(--color-earth-900)] leading-none">
          {value}
        </span>
      </div>

      <div>
        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]">
          {label}
        </p>
        {sublabel && (
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] rounded-[var(--radius-lg)]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
