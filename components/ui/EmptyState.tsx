import * as React from 'react'
import { Button } from './Button'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** SVG / React element shown above the title */
  icon?:        React.ReactNode
  title:        string
  description?: string
  /** If provided, renders a primary button below the description */
  action?: {
    label:   string
    onClick: () => void
  }
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={
        'flex flex-col items-center justify-center gap-[var(--spacing-4)] ' +
        'py-[var(--spacing-16)] px-[var(--spacing-6)] text-center ' +
        className
      }
    >
      {icon && (
        <span
          aria-hidden="true"
          className="text-[var(--color-earth-300)] [&_svg]:w-12 [&_svg]:h-12"
        >
          {icon}
        </span>
      )}

      <div className="flex flex-col gap-[var(--spacing-2)]">
        <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-800)]">
          {title}
        </p>
        {description && (
          <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] max-w-sm">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'
