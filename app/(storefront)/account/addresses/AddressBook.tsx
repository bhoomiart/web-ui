'use client';
/**
 * AddressBook: list, add, edit, delete and choose the default delivery address.
 * Every change goes through /api/addresses; the server re-validates and the
 * database keeps exactly one default.
 */
import React from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import { INDIA_STATES } from '@/lib/india-states';
import type { SavedAddress } from '@/lib/addresses';

const MAX_ADDRESSES = 10;

const inputClass =
  'w-full px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-sm)] text-[var(--color-earth-900)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';
const btnPrimary =
  'px-[var(--spacing-5)] h-10 rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-bold hover:bg-[var(--color-earth-700)] disabled:opacity-60 transition-colors';
const btnGhost =
  'px-[var(--spacing-4)] h-9 rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--color-earth-700)] text-[var(--font-size-xs)] font-semibold hover:border-[var(--color-earth-400)] disabled:opacity-60 transition-colors';

type FormValues = {
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
};

const EMPTY: FormValues = {
  label: '',
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  is_default: false,
};

function toForm(a: SavedAddress): FormValues {
  return {
    label: a.label ?? '',
    full_name: a.full_name,
    phone: a.phone,
    address_line1: a.address_line1,
    address_line2: a.address_line2 ?? '',
    city: a.city,
    state: a.state,
    postal_code: a.postal_code,
    is_default: a.is_default,
  };
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1"
      >
        {label}{' '}
        {required && (
          <span aria-hidden="true" className="text-[var(--color-error)]">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  editing,
  isFirst,
  onCancel,
  onSaved,
}: {
  initial: FormValues;
  /** Address id when editing, null when adding */
  editing: string | null;
  isFirst: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<FormValues>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<{ field: string; error: string } | null>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (fieldError?.field === key) setFieldError(null);
  }
  const err = (f: string) => (fieldError?.field === f ? fieldError.error : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setFieldError(null);
    try {
      const res = await fetch(editing ? `/api/addresses/${editing}` : '/api/addresses', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!res.ok) {
        if (data.field) {
          setFieldError({ field: data.field, error: data.error ?? 'Check this field.' });
          document.getElementById(`addr-${data.field}`)?.focus();
        } else {
          setError(data.error ?? 'Could not save the address.');
        }
        return;
      }
      onSaved();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-5)] grid sm:grid-cols-2 gap-[var(--spacing-4)]"
    >
      <h2 className="heading-5 sm:col-span-2">{editing ? 'Edit address' : 'Add a new address'}</h2>
      <Field id="addr-full_name" label="Full name" required error={err('full_name')}>
        <input
          id="addr-full_name"
          value={values.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(err('full_name'))}
          className={inputClass}
        />
      </Field>
      <Field id="addr-phone" label="Phone" required error={err('phone')}>
        <input
          id="addr-phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
          autoComplete="tel"
          placeholder="+91 98765 43210"
          aria-invalid={Boolean(err('phone'))}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field id="addr-address_line1" label="Address line 1" required error={err('address_line1')}>
          <input
            id="addr-address_line1"
            value={values.address_line1}
            onChange={(e) => set('address_line1', e.target.value)}
            autoComplete="address-line1"
            aria-invalid={Boolean(err('address_line1'))}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="addr-address_line2" label="Address line 2" error={err('address_line2')}>
          <input
            id="addr-address_line2"
            value={values.address_line2}
            onChange={(e) => set('address_line2', e.target.value)}
            autoComplete="address-line2"
            className={inputClass}
          />
        </Field>
      </div>
      <Field id="addr-city" label="City" required error={err('city')}>
        <input
          id="addr-city"
          value={values.city}
          onChange={(e) => set('city', e.target.value)}
          autoComplete="address-level2"
          aria-invalid={Boolean(err('city'))}
          className={inputClass}
        />
      </Field>
      <Field id="addr-state" label="State" required error={err('state')}>
        <select
          id="addr-state"
          value={values.state}
          onChange={(e) => set('state', e.target.value)}
          aria-invalid={Boolean(err('state'))}
          className={inputClass}
        >
          <option value="">Select state</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field id="addr-postal_code" label="Postal code" required error={err('postal_code')}>
        <input
          id="addr-postal_code"
          inputMode="numeric"
          maxLength={6}
          value={values.postal_code}
          onChange={(e) => set('postal_code', e.target.value)}
          autoComplete="postal-code"
          aria-invalid={Boolean(err('postal_code'))}
          className={inputClass}
        />
      </Field>
      <Field id="addr-label" label="Label (optional)">
        <input
          id="addr-label"
          value={values.label}
          onChange={(e) => set('label', e.target.value)}
          placeholder="Home, Work…"
          maxLength={40}
          className={inputClass}
        />
      </Field>
      {!isFirst && !initial.is_default && (
        <label className="sm:col-span-2 flex items-center gap-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
          <input
            type="checkbox"
            checked={values.is_default}
            onChange={(e) => set('is_default', e.target.checked)}
          />
          Make this my default address
        </label>
      )}
      {error && (
        <p
          role="alert"
          className="sm:col-span-2 text-[var(--font-size-sm)] text-[var(--color-error)]"
        >
          {error}
        </p>
      )}
      <div className="sm:col-span-2 flex gap-[var(--spacing-3)]">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AddressBook() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authReady = useAuthStore((s) => s.ready);
  const openAuth = useAuthModalStore((s) => s.open);

  const [addresses, setAddresses] = React.useState<SavedAddress[] | null>(null);
  const [state, setState] = React.useState<'loading' | 'ok' | 'guest' | 'error'>('loading');
  const [reloadKey, setReloadKey] = React.useState(0);
  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);

  // null = closed, 'new' = adding, otherwise the id being edited
  const [formFor, setFormFor] = React.useState<string | 'new' | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    fetch('/api/addresses', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setAddresses(null);
          setState('guest');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error();
        setAddresses(data.addresses as SavedAddress[]);
        setState('ok');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, userId, reloadKey]);

  async function act(id: string, run: () => Promise<Response>, failText: string) {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await run();
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setActionError(data.error ?? failText);
        return;
      }
      setConfirmDelete(null);
      reload();
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (state === 'loading') {
    return (
      <p className="body-base text-[var(--color-earth-600)]" role="status">
        Loading your addresses…
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div role="alert" className="text-[var(--color-error)]">
        Could not load your addresses.{' '}
        <button type="button" className="underline" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }

  if (state === 'guest' || !addresses) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] text-center">
        <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-3)]">
          Sign in to manage your saved addresses
        </p>
        <button
          type="button"
          onClick={() => openAuth({ reason: 'Sign in to manage your addresses' })}
          className={btnPrimary}
        >
          Sign in
        </button>
      </div>
    );
  }

  const editingAddress = addresses.find((a) => a.id === formFor) ?? null;

  return (
    <div className="flex flex-col gap-[var(--spacing-4)]">
      {addresses.length === 0 && formFor !== 'new' && (
        <p className="body-base text-[var(--color-earth-600)]">You have no saved addresses yet.</p>
      )}

      {addresses.map((a) =>
        formFor === a.id && editingAddress ? (
          <AddressForm
            key={a.id}
            initial={toForm(editingAddress)}
            editing={a.id}
            isFirst={addresses.length === 1}
            onCancel={() => setFormFor(null)}
            onSaved={() => {
              setFormFor(null);
              reload();
            }}
          />
        ) : (
          <div
            key={a.id}
            className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-5)]"
          >
            <div className="flex items-start justify-between gap-[var(--spacing-3)] flex-wrap">
              <div className="text-[var(--font-size-sm)] text-[var(--color-earth-700)] leading-relaxed">
                <p className="font-semibold text-[var(--color-earth-900)]">
                  {a.full_name}
                  {a.label && (
                    <span className="ml-2 text-[var(--font-size-xs)] font-medium text-[var(--color-earth-500)]">
                      {a.label}
                    </span>
                  )}
                </p>
                <p>{a.address_line1}</p>
                {a.address_line2 && <p>{a.address_line2}</p>}
                <p>
                  {a.city}, {a.state} {a.postal_code}
                </p>
                <p>{a.phone}</p>
              </div>
              {a.is_default && (
                <span className="inline-flex px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] bg-[var(--color-success-light)] text-[var(--color-success)] text-[var(--font-size-xs)] font-semibold">
                  Default
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-[var(--spacing-2)] mt-[var(--spacing-4)]">
              <button type="button" className={btnGhost} onClick={() => setFormFor(a.id)}>
                Edit
              </button>
              {!a.is_default && (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={busyId === a.id}
                  onClick={() =>
                    act(
                      a.id,
                      () =>
                        fetch(`/api/addresses/${a.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_default: true }),
                        }),
                      'Could not change the default address.'
                    )
                  }
                >
                  Set as default
                </button>
              )}
              {confirmDelete === a.id ? (
                <>
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() =>
                      act(
                        a.id,
                        () => fetch(`/api/addresses/${a.id}`, { method: 'DELETE' }),
                        'Could not delete the address.'
                      )
                    }
                    className="px-[var(--spacing-4)] h-9 rounded-[var(--radius-button)] bg-[var(--color-error)] text-white text-[var(--font-size-xs)] font-semibold disabled:opacity-60"
                  >
                    {busyId === a.id ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button type="button" className={btnGhost} onClick={() => setConfirmDelete(null)}>
                    Keep
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(a.id)}
                  className="px-[var(--spacing-4)] h-9 rounded-[var(--radius-button)] border border-[var(--color-error)] text-[var(--color-error)] text-[var(--font-size-xs)] font-semibold"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )
      )}

      {actionError && (
        <p role="alert" className="text-[var(--font-size-sm)] text-[var(--color-error)]">
          {actionError}
        </p>
      )}

      {formFor === 'new' ? (
        <AddressForm
          initial={EMPTY}
          editing={null}
          isFirst={addresses.length === 0}
          onCancel={() => setFormFor(null)}
          onSaved={() => {
            setFormFor(null);
            reload();
          }}
        />
      ) : addresses.length < MAX_ADDRESSES ? (
        <div>
          <button type="button" className={btnPrimary} onClick={() => setFormFor('new')}>
            Add a new address
          </button>
        </div>
      ) : (
        <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
          You have saved the maximum of {MAX_ADDRESSES} addresses. Delete one to add another.
        </p>
      )}
    </div>
  );
}
