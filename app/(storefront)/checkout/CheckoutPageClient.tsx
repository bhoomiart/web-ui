'use client';

/**
 * CheckoutPageClient (A6-T2, rebuilt in A10-T6)
 *
 *   signed out  Sign-in prompt (the modal opens by itself once). The order summary
 *               stays visible and the cart is untouched.
 *   signed in   Contact and delivery form. Stock, prices and shipping come from the
 *               server and are refreshed on arrival and whenever the delivery state
 *               changes. "Place Order" posts the form only: the order is built from
 *               the server cart by POST /api/checkout.
 *
 * Every failure the server can return is handled with a clear message and a way
 * forward (sign in again, review the cart, accept the new total, retry).
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartUiStore } from '@/lib/store/cartUiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useAuthModalStore } from '@/lib/store/authModalStore';
import { trackEvent } from '@/lib/analytics';
import { INDIA_STATES } from '@/lib/india-states';
import { validateEmail } from '@/lib/auth/validation';
import type { SavedAddress } from '@/lib/addresses';

export interface CheckoutInitial {
  authed: boolean;
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

const ADDRESS_FIELDS = new Set(['addressLine1', 'addressLine2', 'city', 'state', 'postalCode']);

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

function Field({
  label,
  htmlFor,
  required,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]"
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
          id={`${htmlFor}-error`}
          className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:ring-2';
const inputClass = `${inputBase} border-[var(--color-earth-200)] focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/20`;
const inputErrorClass = `${inputBase} border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20`;

/** Server messages that mean "look at your cart again". */
const CART_CODES = new Set(['CART_CHANGED', 'STOCK_CHANGED', 'CART_EMPTY']);

export function CheckoutPageClient({
  initial,
  addresses,
}: {
  initial: CheckoutInitial;
  addresses: SavedAddress[];
}) {
  const router = useRouter();

  // The cart lives in localStorage, so the server cannot render it. Wait for the
  // browser before deciding anything about it (avoids a flash of "cart is empty").
  const hydrated = React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals);
  const syncing = useCartStore((s) => s.syncing);
  const source = useCartStore((s) => s.source);
  const syncWithServer = useCartStore((s) => s.syncWithServer);
  const setShippingState = useCartStore((s) => s.setShippingState);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCartOpen = useCartUiStore((s) => s.setOpen);

  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const openAuth = useAuthModalStore((s) => s.open);
  const signedIn = authReady ? Boolean(user) : initial.authed;

  const [form, setForm] = React.useState({
    customerName: initial.name,
    phone: initial.phone,
    email: initial.email,
    addressLine1: initial.addressLine1,
    addressLine2: initial.addressLine2,
    city: initial.city,
    state: initial.state,
    postalCode: initial.postalCode,
    notes: '',
    customization: '',
  });
  // Which saved address the form was filled from. 'new' = typed by hand.
  const [selectedId, setSelectedId] = React.useState<string>(
    () => (addresses.find((a) => a.is_default) ?? addresses[0])?.id ?? 'new'
  );
  const [saveAddress, setSaveAddress] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<{ text: string; cart?: boolean } | null>(
    null
  );

  const startTracked = React.useRef(false);
  const promptedAuth = React.useRef(false);
  const totalsTried = React.useRef('');

  // ── effects ────────────────────────────────────────────────────────────────

  // Signed out: open the sign-in modal once, with a reason. Closing it leaves the prompt card.
  React.useEffect(() => {
    if (!hydrated || !authReady || signedIn || promptedAuth.current) return;
    promptedAuth.current = true;
    openAuth({ reason: 'Sign in to continue with your checkout', redirectTo: '/checkout' });
  }, [hydrated, authReady, signedIn, openAuth]);

  // Signed in: fresh stock and prices on arrival, and the delivery state for shipping.
  React.useEffect(() => {
    if (!hydrated || !signedIn) return;
    if (initial.state) setShippingState(initial.state);
    void syncWithServer({ force: true, notify: true });
    // Runs once per arrival. The deps below are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, signedIn]);

  // Totals are cleared when the cart changes elsewhere. Fetch them again for the chosen state.
  React.useEffect(() => {
    if (!signedIn || source !== 'server' || !form.state || totals || syncing) return;
    const key = `${form.state}|${items.length}`;
    if (totalsTried.current === key) return; // do not loop if the request keeps failing
    totalsTried.current = key;
    void syncWithServer({ force: true, notify: false });
  }, [signedIn, source, form.state, totals, syncing, items.length, syncWithServer]);

  const cartReady = signedIn && source === 'server';

  React.useEffect(() => {
    if (startTracked.current || !cartReady || items.length === 0) return;
    startTracked.current = true;
    trackEvent('checkout_start', {
      item_count: items.length,
      value: items.reduce((n, i) => n + i.price * i.quantity, 0),
      currency: 'INR',
    });
  }, [cartReady, items]);

  // ── derived ────────────────────────────────────────────────────────────────

  const blocking = items.filter((i) => i.status === 'out_of_stock' || i.status === 'unavailable');
  const subtotal = items.reduce(
    (n, i) =>
      i.status === 'out_of_stock' || i.status === 'unavailable' ? n : n + i.price * i.quantity,
    0
  );
  const shippingKnown = Boolean(form.state) && totals != null && !totals.shippingPending;
  const grandTotal = shippingKnown ? totals!.total : subtotal;

  // A chosen saved address is shown as a card; the fields appear for a new address
  const showAddressFields = !signedIn || addresses.length === 0 || selectedId === 'new';

  // ── handlers ───────────────────────────────────────────────────────────────

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    // Editing a saved address by hand makes it a new address
    if (ADDRESS_FIELDS.has(field)) setSelectedId('new');
  }
  function pickAddress(a: SavedAddress) {
    setSelectedId(a.id);
    setForm((f) => ({
      ...f,
      customerName: a.full_name,
      phone: a.phone,
      addressLine1: a.address_line1,
      addressLine2: a.address_line2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postal_code,
    }));
    setErrors({});
    setServerError(null);
    setShippingState(a.state);
    void syncWithServer({ force: true, notify: false });
  }
  function useNewAddress() {
    setSelectedId('new');
    setForm((f) => ({
      ...f,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
    }));
    setShippingState(null);
  }

  function chooseState(value: string) {
    set('state', value);
    setShippingState(value || null);
    setServerError(null);
    if (value) void syncWithServer({ force: true, notify: false });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid phone number (10–15 digits).';
    if (form.email.trim() && validateEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!/^[1-9][0-9]{5}$/.test(form.postalCode.trim()))
      e.postalCode = 'Enter a valid 6-digit postal code.';
    if (!form.state) e.state = 'Select where we should deliver.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = [
        'customerName',
        'phone',
        'email',
        'addressLine1',
        'city',
        'state',
        'postalCode',
      ].find((k) => errs[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    if (!shippingKnown) {
      setServerError({ text: 'Working out your delivery charge. Please try again in a moment.' });
      void syncWithServer({ force: true, notify: false });
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only the form and the total the customer saw. The server builds the order from the saved cart.
        body: JSON.stringify({
          ...form,
          saveAddress: signedIn && selectedId === 'new' && saveAddress,
          expectedTotal: totals!.total,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        orderNumber?: string;
        error?: string;
        code?: string;
        field?: string;
      };

      if (res.status === 401) {
        setServerError({ text: 'Please sign in again to place your order.' });
        openAuth({ reason: 'Sign in to place your order', redirectTo: '/checkout' });
        return;
      }

      if (!res.ok || !data.orderNumber) {
        const text = data.error ?? 'Something went wrong. Please try again.';
        if (data.field) setErrors((er) => ({ ...er, [data.field!]: text }));
        setServerError({ text, cart: data.code ? CART_CODES.has(data.code) : false });
        // Show the customer what changed: fresh lines, prices, stock and totals.
        if (data.code && (CART_CODES.has(data.code) || data.code === 'TOTAL_CHANGED')) {
          void syncWithServer({ force: true, notify: data.code !== 'TOTAL_CHANGED' });
        }
        return;
      }

      trackEvent('order_submit', {
        order_number: data.orderNumber,
        item_count: items.length,
        value: totals!.total,
        currency: 'INR',
      });
      // The server already emptied the saved cart as part of placing the order.
      void clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setServerError({
        text: 'We could not reach the server. Your cart is safe. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ── states ─────────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div
        className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]"
        aria-busy="true"
      >
        <h1 className="heading-2 mb-[var(--spacing-8)]">Checkout</h1>
        <div className="grid lg:grid-cols-[1fr_380px] gap-[var(--spacing-8)]">
          <div className="h-72 rounded-[var(--radius-xl)] bg-[var(--color-earth-100)] animate-pulse" />
          <div className="h-72 rounded-[var(--radius-xl)] bg-[var(--color-earth-100)] animate-pulse" />
        </div>
      </div>
    );
  }

  // Signed in and the saved cart has loaded, but it is empty.
  // Signed out with nothing in the local cart: also empty.
  if (items.length === 0 && (cartReady || !signedIn) && !syncing) {
    return (
      <div className="container-brand py-[var(--spacing-16)] text-center">
        <p className="heading-3 mb-[var(--spacing-4)]">Your cart is empty</p>
        <p className="body-large text-[var(--color-earth-600)] mb-[var(--spacing-8)]">
          Add some pieces to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  const placeDisabled =
    submitting || syncing || blocking.length > 0 || !shippingKnown || items.length === 0;

  return (
    <div className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]">
      <h1 className="heading-2 mb-[var(--spacing-8)]">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-[1fr_380px] gap-[var(--spacing-8)]">
          {/* ── Left ── */}
          <div className="flex flex-col gap-[var(--spacing-8)]">
            {!signedIn ? (
              <section
                aria-labelledby="checkout-signin-heading"
                className="rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] bg-white p-[var(--spacing-6)] shadow-[var(--shadow-card)]"
              >
                <h2 id="checkout-signin-heading" className="heading-4 mb-[var(--spacing-2)]">
                  Sign in to continue
                </h2>
                <p className="body-base text-[var(--color-earth-600)] mb-[var(--spacing-5)]">
                  We need an account to place your order and keep your orders in one place. Your
                  cart is saved and will be here when you are back.
                </p>
                <div className="flex flex-wrap gap-[var(--spacing-3)]">
                  <button
                    type="button"
                    onClick={() =>
                      openAuth({
                        reason: 'Sign in to continue with your checkout',
                        redirectTo: '/checkout',
                      })
                    }
                    className="px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openAuth({
                        reason: 'Create an account to continue with your checkout',
                        redirectTo: '/checkout',
                        tab: 'signup',
                      })
                    }
                    className="px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
                  >
                    Create account
                  </button>
                </div>
              </section>
            ) : !cartReady ? (
              <div
                role="status"
                className="flex items-center gap-[var(--spacing-3)] text-[var(--color-earth-600)]"
              >
                <span
                  aria-hidden="true"
                  className="w-5 h-5 rounded-full border-2 border-[var(--color-earth-200)] border-t-[var(--color-brand-primary)] animate-spin"
                />
                Loading your saved cart…
              </div>
            ) : (
              <>
                {/* Items that need attention */}
                {blocking.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-[var(--radius-lg)] border border-[var(--color-error)] bg-[var(--color-error-light)] p-[var(--spacing-4)] text-[var(--font-size-sm)] text-[var(--color-error-dark)]"
                  >
                    <p className="font-semibold">
                      {blocking.length === 1
                        ? `"${blocking[0].name}" can't be ordered right now.`
                        : `${blocking.length} items can't be ordered right now.`}
                    </p>
                    <p className="mt-1">Remove them from your cart to place this order.</p>
                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="mt-[var(--spacing-3)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-error)] text-white font-semibold hover:opacity-90"
                    >
                      Review your cart
                    </button>
                  </div>
                )}

                {/* Contact */}
                <section>
                  <h2 className="heading-5 mb-[var(--spacing-5)]">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-[var(--spacing-4)]">
                    <Field
                      label="Full Name"
                      htmlFor="customerName"
                      required
                      error={errors.customerName}
                    >
                      <input
                        id="customerName"
                        type="text"
                        value={form.customerName}
                        onChange={(e) => set('customerName', e.target.value)}
                        autoComplete="name"
                        placeholder="Your full name"
                        aria-invalid={Boolean(errors.customerName)}
                        aria-describedby={errors.customerName ? 'customerName-error' : undefined}
                        className={errors.customerName ? inputErrorClass : inputClass}
                      />
                    </Field>
                    <Field label="WhatsApp / Phone" htmlFor="phone" required error={errors.phone}>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className={errors.phone ? inputErrorClass : inputClass}
                      />
                    </Field>
                    <Field label="Email" htmlFor="email" error={errors.email}>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className={errors.email ? inputErrorClass : inputClass}
                      />
                    </Field>
                  </div>
                </section>

                {/* Delivery */}
                <section>
                  <h2 className="heading-5 mb-[var(--spacing-5)]">Delivery Address</h2>
                  {signedIn && addresses.length > 0 && (
                    <fieldset className="mb-[var(--spacing-5)] flex flex-col gap-[var(--spacing-2)]">
                      <legend className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
                        Saved addresses
                      </legend>
                      {addresses.map((a) => (
                        <label
                          key={a.id}
                          className={`flex items-start gap-[var(--spacing-3)] p-[var(--spacing-3)] rounded-[var(--radius-md)] border cursor-pointer ${
                            selectedId === a.id
                              ? 'border-[var(--color-brand-primary)] bg-[var(--color-earth-50)]'
                              : 'border-[var(--color-earth-200)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedId === a.id}
                            onChange={() => pickAddress(a)}
                            className="mt-1"
                          />
                          <span className="text-[var(--font-size-sm)] text-[var(--color-earth-700)] leading-relaxed">
                            <span className="font-semibold text-[var(--color-earth-900)]">
                              {a.full_name}
                              {a.label ? ` · ${a.label}` : ''}
                              {a.is_default ? ' (default)' : ''}
                            </span>
                            <br />
                            {a.address_line1}
                            {a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city}, {a.state}{' '}
                            {a.postal_code}
                          </span>
                        </label>
                      ))}
                      <label
                        className={`flex items-center gap-[var(--spacing-3)] p-[var(--spacing-3)] rounded-[var(--radius-md)] border cursor-pointer text-[var(--font-size-sm)] ${
                          selectedId === 'new'
                            ? 'border-[var(--color-brand-primary)] bg-[var(--color-earth-50)]'
                            : 'border-[var(--color-earth-200)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selectedId === 'new'}
                          onChange={useNewAddress}
                        />
                        Use a different address
                      </label>
                    </fieldset>
                  )}
                  {showAddressFields && (
                    <div className="grid sm:grid-cols-2 gap-[var(--spacing-4)]">
                      <Field
                        label="Address Line 1"
                        htmlFor="addressLine1"
                        required
                        error={errors.addressLine1}
                      >
                        <input
                          id="addressLine1"
                          type="text"
                          value={form.addressLine1}
                          onChange={(e) => set('addressLine1', e.target.value)}
                          autoComplete="address-line1"
                          placeholder="House / flat, street"
                          aria-invalid={Boolean(errors.addressLine1)}
                          aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
                          className={errors.addressLine1 ? inputErrorClass : inputClass}
                        />
                      </Field>
                      <Field label="Address Line 2" htmlFor="addressLine2">
                        <input
                          id="addressLine2"
                          type="text"
                          value={form.addressLine2}
                          onChange={(e) => set('addressLine2', e.target.value)}
                          autoComplete="address-line2"
                          placeholder="Area / landmark"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="City" htmlFor="city" required error={errors.city}>
                        <input
                          id="city"
                          type="text"
                          value={form.city}
                          onChange={(e) => set('city', e.target.value)}
                          autoComplete="address-level2"
                          placeholder="City"
                          aria-invalid={Boolean(errors.city)}
                          aria-describedby={errors.city ? 'city-error' : undefined}
                          className={errors.city ? inputErrorClass : inputClass}
                        />
                      </Field>
                      <Field label="State" htmlFor="state" required error={errors.state}>
                        <select
                          id="state"
                          value={form.state}
                          onChange={(e) => chooseState(e.target.value)}
                          autoComplete="address-level1"
                          aria-invalid={Boolean(errors.state)}
                          aria-describedby={errors.state ? 'state-error' : undefined}
                          className={errors.state ? inputErrorClass : inputClass}
                        >
                          <option value="">Select state</option>
                          {INDIA_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Postal Code"
                        htmlFor="postalCode"
                        required
                        error={errors.postalCode}
                      >
                        <input
                          id="postalCode"
                          type="text"
                          inputMode="numeric"
                          value={form.postalCode}
                          onChange={(e) => set('postalCode', e.target.value)}
                          autoComplete="postal-code"
                          placeholder="600001"
                          maxLength={6}
                          aria-invalid={Boolean(errors.postalCode)}
                          aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
                          className={errors.postalCode ? inputErrorClass : inputClass}
                        />
                      </Field>
                    </div>
                  )}
                  {signedIn && addresses.length > 0 && (
                    <p className="mt-[var(--spacing-3)] text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                      <Link href="/account/addresses" className="underline">
                        Manage saved addresses
                      </Link>
                    </p>
                  )}
                  {signedIn && selectedId === 'new' && (
                    <label className="mt-[var(--spacing-4)] flex items-center gap-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                      />
                      Save this address to my account
                    </label>
                  )}
                </section>

                {/* Notes */}
                <section>
                  <h2 className="heading-5 mb-[var(--spacing-5)]">Additional Notes</h2>
                  <div className="flex flex-col gap-[var(--spacing-4)]">
                    <Field label="Order Notes" htmlFor="notes">
                      <textarea
                        id="notes"
                        value={form.notes}
                        onChange={(e) => set('notes', e.target.value)}
                        rows={3}
                        placeholder="Delivery instructions, packaging preferences…"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Customization Request" htmlFor="customization">
                      <textarea
                        id="customization"
                        value={form.customization}
                        onChange={(e) => set('customization', e.target.value)}
                        rows={3}
                        placeholder="Describe any customizations you need…"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <div
                  className="rounded-[var(--radius-lg)] p-[var(--spacing-5)] border border-[var(--color-earth-200)]"
                  style={{ background: 'var(--color-earth-50)' }}
                >
                  <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-2)]">
                    Payment Method
                  </p>
                  <p className="body-small">
                    We accept payment via <strong>bank transfer</strong> or <strong>UPI</strong>{' '}
                    after confirming your order on WhatsApp. No online payment is collected here.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── Right: order summary ── */}
          <div className="flex flex-col gap-[var(--spacing-5)]">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-5)] lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-[var(--spacing-5)]">
                <h2 className="heading-5">Order Summary</h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  Edit cart
                </button>
              </div>

              <ul
                className="flex flex-col divide-y divide-[var(--color-earth-100)] mb-[var(--spacing-5)]"
                role="list"
              >
                {items.map((item) => {
                  const bad = item.status === 'out_of_stock' || item.status === 'unavailable';
                  return (
                    <li
                      key={item.key}
                      className="flex gap-[var(--spacing-3)] py-[var(--spacing-3)]"
                    >
                      <div
                        className={`w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-earth-100)] shrink-0 ${bad ? 'opacity-50 grayscale' : ''}`}
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] truncate">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
                          Qty: {item.quantity} × {fmt(item.price)}
                        </p>
                        {bad && (
                          <p className="text-[var(--font-size-xs)] font-semibold text-[var(--color-error)]">
                            {item.status === 'out_of_stock'
                              ? 'Out of Stock'
                              : 'No longer available'}
                          </p>
                        )}
                        {(item.status === 'adjusted' || item.status === 'low_stock') &&
                          item.message && (
                            <p
                              className="text-[var(--font-size-xs)] font-semibold"
                              style={{ color: 'var(--color-warning-dark)' }}
                            >
                              {item.message}
                            </p>
                          )}
                      </div>
                      <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)] shrink-0">
                        {bad ? '—' : fmt(item.price * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <dl className="border-t border-[var(--color-earth-100)] pt-[var(--spacing-4)] text-[var(--font-size-sm)]">
                <div className="flex justify-between mb-[var(--spacing-1)]">
                  <dt className="text-[var(--color-earth-600)]">Subtotal</dt>
                  <dd className="font-semibold text-[var(--color-earth-800)]">{fmt(subtotal)}</dd>
                </div>
                <div className="flex justify-between mb-[var(--spacing-1)]">
                  <dt className="text-[var(--color-earth-600)]">
                    Shipping{shippingKnown && form.state ? ` to ${form.state}` : ''}
                  </dt>
                  <dd className="text-[var(--color-earth-700)]">
                    {shippingKnown ? (
                      totals!.shippingFee === 0 ? (
                        <span className="font-semibold text-[var(--color-forest-500)]">Free</span>
                      ) : (
                        fmt(totals!.shippingFee ?? 0)
                      )
                    ) : form.state ? (
                      'Calculating…'
                    ) : (
                      'Select your state'
                    )}
                  </dd>
                </div>
                {shippingKnown && totals!.discount > 0 && (
                  <div className="flex justify-between mb-[var(--spacing-1)]">
                    <dt className="text-[var(--color-earth-600)]">Discount</dt>
                    <dd className="text-[var(--color-forest-500)]">−{fmt(totals!.discount)}</dd>
                  </div>
                )}
                {shippingKnown &&
                  totals!.freeShippingRemaining != null &&
                  totals!.freeShippingRemaining > 0 && (
                    <p className="text-[var(--font-size-xs)] text-[var(--color-forest-500)] mb-[var(--spacing-1)]">
                      Add {fmt(totals!.freeShippingRemaining)} more for free shipping.
                    </p>
                  )}
                <div className="flex justify-between font-bold text-[var(--font-size-base)] border-t border-[var(--color-earth-200)] pt-[var(--spacing-3)] mt-[var(--spacing-3)]">
                  <dt>{shippingKnown ? 'Total' : 'Estimated total'}</dt>
                  <dd style={{ color: 'var(--color-brand-primary)' }}>{fmt(grandTotal)}</dd>
                </div>
              </dl>

              {/* Server message */}
              {serverError && (
                <div
                  role="alert"
                  className="mt-[var(--spacing-4)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] text-[var(--color-error-dark)] text-[var(--font-size-sm)]"
                >
                  <p>{serverError.text}</p>
                  {serverError.cart && (
                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="mt-[var(--spacing-2)] font-semibold underline"
                    >
                      Review your cart
                    </button>
                  )}
                </div>
              )}

              {signedIn && cartReady ? (
                <button
                  type="submit"
                  disabled={placeDisabled}
                  aria-disabled={placeDisabled}
                  className="mt-[var(--spacing-5)] w-full h-12 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] disabled:bg-[var(--color-earth-200)] disabled:text-[var(--color-earth-500)] disabled:shadow-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
                >
                  {submitting ? (
                    <>
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                        aria-hidden="true"
                      />
                      Placing your order…
                    </>
                  ) : !form.state ? (
                    'Select your state to continue'
                  ) : blocking.length > 0 ? (
                    'Remove unavailable items to continue'
                  ) : (
                    `Place Order · ${fmt(grandTotal)}`
                  )}
                </button>
              ) : (
                <p className="mt-[var(--spacing-5)] text-center text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                  {signedIn ? 'Loading your saved cart…' : 'Sign in to place your order.'}
                </p>
              )}

              <p className="mt-[var(--spacing-3)] text-center text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
                By placing your order you agree to our{' '}
                <Link
                  href="/policies/returns"
                  className="underline hover:text-[var(--color-brand-primary)]"
                >
                  Return Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
