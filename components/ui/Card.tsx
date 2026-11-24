import * as React from 'react'

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lifts the card shadow on hover. Default: false */
  hoverable?: boolean
}

export function Card({
  hoverable  = false,
  className  = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={
        'rounded-[var(--radius-card)] border border-[var(--color-earth-200)] ' +
        'bg-white shadow-[var(--shadow-card)] ' +
        (hoverable
          ? 'transition-shadow duration-[var(--duration-normal)] ' +
            'hover:shadow-[var(--shadow-card-hover)] '
          : '') +
        className
      }
      {...rest}
    >
      {children}
    </div>
  )
}

Card.displayName = 'Card'

// ─── Header ───────────────────────────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = '', children, ...rest }: CardHeaderProps) {
  return (
    <div
      className={
        'px-[var(--spacing-6)] py-[var(--spacing-5)] ' +
        'border-b border-[var(--color-earth-100)] ' +
        className
      }
      {...rest}
    >
      {children}
    </div>
  )
}

CardHeader.displayName = 'CardHeader'

// ─── Body ─────────────────────────────────────────────────────────────────────

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className = '', children, ...rest }: CardBodyProps) {
  return (
    <div
      className={`px-[var(--spacing-6)] py-[var(--spacing-5)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

CardBody.displayName = 'CardBody'

// ─── Footer ───────────────────────────────────────────────────────────────────

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className = '', children, ...rest }: CardFooterProps) {
  return (
    <div
      className={
        'px-[var(--spacing-6)] py-[var(--spacing-4)] ' +
        'border-t border-[var(--color-earth-100)] ' +
        'bg-[var(--color-earth-50)] rounded-b-[var(--radius-card)] ' +
        className
      }
      {...rest}
    >
      {children}
    </div>
  )
}

CardFooter.displayName = 'CardFooter'

// ─── CardTitle convenience ───────────────────────────────────────────────────

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function CardTitle({ as: Tag = 'h3', className = '', children, ...rest }: CardTitleProps) {
  return (
    <Tag
      className={
        'font-sans text-[var(--font-size-lg)] font-semibold ' +
        'text-[var(--color-earth-900)] leading-snug ' +
        className
      }
      {...rest}
    >
      {children}
    </Tag>
  )
}

CardTitle.displayName = 'CardTitle'
