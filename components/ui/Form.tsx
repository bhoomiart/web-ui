import * as React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════════════════════════════════════

const LABEL_BASE =
  'block text-[var(--font-size-sm)] font-medium text-[var(--color-earth-700)] mb-1.5';

const INPUT_BASE =
  'block w-full rounded-[var(--radius-input)] border border-[var(--color-earth-200)] ' +
  'bg-white px-[var(--spacing-4)] py-[var(--spacing-2-5)] ' +
  'text-[var(--font-size-base)] text-[var(--color-earth-900)] ' +
  'placeholder:text-[var(--color-earth-400)] ' +
  'transition-colors duration-[var(--duration-fast)] ' +
  'focus:outline-none focus:border-[var(--color-brand-primary)] ' +
  'focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 ' +
  'disabled:cursor-not-allowed disabled:bg-[var(--color-earth-50)] disabled:opacity-60 ';

const INPUT_ERROR =
  'border-[var(--color-error)] focus:border-[var(--color-error)] ' +
  'focus:ring-[var(--color-error)]/20 ';

// ═══════════════════════════════════════════════════════════════════════════
// FormField wrapper — groups label + control + hint/error
// ═══════════════════════════════════════════════════════════════════════════

export interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className={LABEL_BASE}>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-[var(--color-error)]">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={htmlFor ? `${htmlFor}-hint` : undefined}
          className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-earth-500)]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

FormField.displayName = 'FormField';

// ═══════════════════════════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════════════════════════

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, className = '', 'aria-describedby': ariaDescribedBy, id, ...rest },
  ref
) {
  const errorId = id ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <input
      ref={ref}
      id={id}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      className={`${INPUT_BASE}${error ? INPUT_ERROR : ''}${className}`}
      {...rest}
    />
  );
});

Input.displayName = 'Input';

// ═══════════════════════════════════════════════════════════════════════════
// Textarea
// ═══════════════════════════════════════════════════════════════════════════

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = '', id, 'aria-describedby': ariaDescribedBy, ...rest },
  ref
) {
  const errorId = id ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <textarea
      ref={ref}
      id={id}
      rows={4}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      className={`${INPUT_BASE} resize-y min-h-[80px] ` + (error ? INPUT_ERROR : '') + className}
      {...rest}
    />
  );
});

Textarea.displayName = 'Textarea';

// ═══════════════════════════════════════════════════════════════════════════
// Select
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    error,
    placeholder,
    children,
    className = '',
    id,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref
) {
  const errorId = id ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <div className="relative">
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`${INPUT_BASE} appearance-none pr-10 ` + (error ? INPUT_ERROR : '') + className}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {/* Chevron icon */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-earth-400)]"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M4 6l4 4 4-4" />
        </svg>
      </span>
    </div>
  );
});

Select.displayName = 'Select';

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox
// ═══════════════════════════════════════════════════════════════════════════

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, className = '', id, ...rest },
  ref
) {
  const generatedId = React.useId();
  const uid = id ?? `checkbox-${generatedId}`;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={uid} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          id={uid}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          className={
            'h-4 w-4 rounded border-[var(--color-earth-300)] ' +
            'text-[var(--color-brand-primary)] ' +
            'focus:ring-[var(--color-brand-primary)] ' +
            'transition-colors duration-[var(--duration-fast)] ' +
            'disabled:cursor-not-allowed disabled:opacity-50'
          }
          {...rest}
        />
        <span className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">{label}</span>
      </label>
      {error && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// ═══════════════════════════════════════════════════════════════════════════
// Radio
// ═══════════════════════════════════════════════════════════════════════════

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  legend?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={`border-0 p-0 m-0 ${className}`}>
      {legend && <legend className={LABEL_BASE}>{legend}</legend>}
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={opt.disabled}
              onChange={() => onChange?.(opt.value)}
              className={
                'h-4 w-4 border-[var(--color-earth-300)] ' +
                'text-[var(--color-brand-primary)] ' +
                'focus:ring-[var(--color-brand-primary)] ' +
                'transition-colors duration-[var(--duration-fast)] ' +
                'disabled:cursor-not-allowed disabled:opacity-50'
              }
            />
            <span className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

RadioGroup.displayName = 'RadioGroup';
