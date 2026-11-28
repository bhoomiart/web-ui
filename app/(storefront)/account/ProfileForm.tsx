'use client';
/**
 * ProfileForm: shows the signed-in customer's details and lets them change name and phone.
 * The email is the sign-in identity, so it is shown but not editable here.
 */
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';

const inputClass =
  'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-900)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';
const btnPrimary =
  'px-[var(--spacing-5)] h-10 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-bold hover:bg-[var(--color-earth-700)] disabled:opacity-60 transition-colors';

interface Profile {
  email: string | null;
  full_name: string;
  phone: string;
}

export function ProfileForm() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authReady = useAuthStore((s) => s.ready);
  const openAuth = useAuthModalStore((s) => s.open);

  const [state, setState] = React.useState<'loading' | 'ok' | 'guest' | 'error'>('loading');
  const [email, setEmail] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{
    ok: boolean;
    text: string;
    field?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    fetch('/api/profile', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setState('guest');
          return;
        }
        const data = (await res.json()) as { profile?: Profile };
        if (!res.ok || !data.profile) throw new Error();
        setEmail(data.profile.email);
        setName(data.profile.full_name);
        setPhone(data.profile.phone);
        setState('ok');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        field?: string;
        profile?: Profile;
      };
      if (!res.ok || !data.profile) {
        setMessage({
          ok: false,
          text: data.error ?? 'Could not save your details.',
          field: data.field,
        });
        if (data.field) document.getElementById(`profile-${data.field}`)?.focus();
        return;
      }
      setName(data.profile.full_name);
      setPhone(data.profile.phone);
      setMessage({ ok: true, text: 'Your details were saved.' });
      // Keep the name shown in the header in step (best effort)
      void createClient().auth.updateUser({ data: { full_name: data.profile.full_name } });
    } catch {
      setMessage({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (state === 'loading') {
    return (
      <p className="body-base text-[var(--color-earth-600)]" role="status">
        Loading your profile…
      </p>
    );
  }
  if (state === 'error') {
    return (
      <p role="alert" className="text-[var(--color-error)]">
        Could not load your profile. Please refresh the page.
      </p>
    );
  }
  if (state === 'guest') {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] text-center">
        <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-3)]">
          Sign in to see your profile
        </p>
        <button
          type="button"
          onClick={() => openAuth({ reason: 'Sign in to see your profile' })}
          className={btnPrimary}
        >
          Sign in
        </button>
      </div>
    );
  }

  const fieldErr = (f: string) =>
    message && !message.ok && message.field === f ? message.text : null;

  return (
    <div className="flex flex-col gap-[var(--spacing-6)]">
      <form
        onSubmit={save}
        noValidate
        className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] flex flex-col gap-[var(--spacing-4)]"
      >
        <h2 className="heading-5">Your details</h2>
        <div>
          <label
            htmlFor="profile-email"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
          >
            Email
          </label>
          <input
            id="profile-email"
            value={email ?? ''}
            readOnly
            disabled
            className={`${inputClass} bg-[var(--color-earth-50)] text-[var(--color-earth-600)]`}
          />
          <p className="mt-1 text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
            This is the email you sign in with.
          </p>
        </div>
        <div>
          <label
            htmlFor="profile-full_name"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
          >
            Full name
          </label>
          <input
            id="profile-full_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(fieldErr('full_name'))}
            className={inputClass}
          />
          {fieldErr('full_name') && (
            <p role="alert" className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]">
              {fieldErr('full_name')}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="profile-phone"
            className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
          >
            Phone / WhatsApp
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            aria-invalid={Boolean(fieldErr('phone'))}
            className={inputClass}
          />
          {fieldErr('phone') && (
            <p role="alert" className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]">
              {fieldErr('phone')}
            </p>
          )}
        </div>
        {message && !message.field && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={`text-[var(--font-size-sm)] ${message.ok ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
          >
            {message.text}
          </p>
        )}
        <div>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </form>

      <div className="grid sm:grid-cols-3 gap-[var(--spacing-3)]">
        {[
          { href: '/account/orders', title: 'Orders', text: 'Track, review or return' },
          {
            href: '/account/addresses',
            title: 'Saved addresses',
            text: 'Manage delivery addresses',
          },
          { href: '/account/payments', title: 'Payment methods', text: 'Coming soon' },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block bg-white rounded-[var(--radius-lg)] border border-[var(--color-earth-200)] p-[var(--spacing-4)] hover:border-[var(--color-brand-primary)] transition-colors"
          >
            <p className="font-semibold text-[var(--color-earth-900)]">{c.title}</p>
            <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
