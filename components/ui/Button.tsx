import * as React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const BASE =
  'inline-flex items-center justify-center gap-2 font-sans font-semibold ' +
  'rounded-[var(--radius-button)] border border-transparent ' +
  'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] ' +
  'focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer ';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand-primary)] text-white ' +
    'hover:bg-[var(--color-earth-700)] active:bg-[var(--color-earth-800)] ' +
    'shadow-[var(--shadow-button)]',

  secondary:
    'bg-transparent text-[var(--color-brand-primary)] ' +
    'border-[var(--color-brand-primary)] ' +
    'hover:bg-[var(--color-earth-50)] active:bg-[var(--color-earth-100)]',

  ghost:
    'bg-transparent text-[var(--color-earth-700)] ' +
    'hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-900)] ' +
    'active:bg-[var(--color-earth-200)]',

  destructive:
    'bg-[var(--color-error)] text-white ' +
    'hover:bg-[var(--color-error-dark)] active:bg-[var(--color-error-dark)] ' +
    'shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8  px-[var(--spacing-4)]  text-[var(--font-size-sm)]  gap-1',
  md: 'h-10 px-[var(--spacing-6)]  text-[var(--font-size-base)]',
  lg: 'h-12 px-[var(--spacing-8)]  text-[var(--font-size-lg)]',
};

const SPINNER_SIZES: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className={`${SPINNER_SIZES[size]} animate-spin rounded-full border-2 border-current border-t-transparent`}
          aria-hidden="true"
        />
      ) : (
        leftIcon && <span aria-hidden="true">{leftIcon}</span>
      )}

      <span>{children}</span>

      {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
