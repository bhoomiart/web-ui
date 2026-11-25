'use client';

/**
 * LoginForm — client component for the admin login page.
 * Calls the signIn server action and shows errors.
 */

import * as React from 'react';
import { signInAction } from './actions';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await signInAction(data);

    setPending(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/admin/dashboard');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--spacing-5)]">
      {/* Email */}
      <div className="flex flex-col gap-[var(--spacing-1-5)]">
        <label
          htmlFor="email"
          className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@example.com"
          className={[
            'w-full px-[var(--spacing-3)] py-[var(--spacing-2-5)]',
            'rounded-[var(--radius-input)]',
            'border border-[var(--color-earth-200)]',
            'text-[var(--font-size-sm)] text-[var(--color-earth-900)]',
            'placeholder:text-[var(--color-earth-300)]',
            'bg-white',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent',
            'transition-shadow duration-[var(--duration-fast)]',
          ].join(' ')}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-[var(--spacing-1-5)]">
        <label
          htmlFor="password"
          className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={[
            'w-full px-[var(--spacing-3)] py-[var(--spacing-2-5)]',
            'rounded-[var(--radius-input)]',
            'border border-[var(--color-earth-200)]',
            'text-[var(--font-size-sm)] text-[var(--color-earth-900)]',
            'placeholder:text-[var(--color-earth-300)]',
            'bg-white',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent',
            'transition-shadow duration-[var(--duration-fast)]',
          ].join(' ')}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="px-[var(--spacing-3)] py-[var(--spacing-2-5)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={[
          'w-full flex items-center justify-center gap-[var(--spacing-2)]',
          'px-[var(--spacing-4)] py-[var(--spacing-3)]',
          'rounded-[var(--radius-button)]',
          'bg-[var(--color-brand-primary)] text-white',
          'text-[var(--font-size-sm)] font-semibold',
          'transition-opacity duration-[var(--duration-fast)]',
          'hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2',
        ].join(' ')}
      >
        {pending ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
