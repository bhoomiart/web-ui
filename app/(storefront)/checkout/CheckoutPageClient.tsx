'use client';

/**
 * CheckoutPageClient (A6-T2)
 *
 * Single-page checkout form. Reads cart from Zustand store.
 * On submit: calls POST /api/checkout, then clears cart and redirects
 * to /order/[number].
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

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
        <p className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-earth-200)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20';

const inputErrorClass =
  'w-full px-[var(--spacing-4)] py-[var(--spacing-2-5)] rounded-[var(--radius-input)] border border-[var(--color-error)] bg-white text-[var(--font-size-base)] text-[var(--color-earth-900)] placeholder:text-[var(--color-earth-400)] focus:outline-none focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20';

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const total = subtotal();

  const [form, setForm] = React.useState({
    customerName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
    customization: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid phone number (10–15 digits).';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            slug: i.slug,
          })),
        }),
      });

      const data = (await res.json()) as { orderNumber?: string; error?: string };

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setServerError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Empty cart
  if (items.length === 0) {
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

  return (
    <div className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]">
      <h1 className="heading-2 mb-[var(--spacing-8)]">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-[1fr_380px] gap-[var(--spacing-8)]">
          {/* ── Left: form fields ── */}
          <div className="flex flex-col gap-[var(--spacing-8)]">
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
                    className={errors.phone ? inputErrorClass : inputClass}
                  />
                </Field>

                <Field label="Email (optional)" htmlFor="email" error={errors.email}>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={errors.email ? inputErrorClass : inputClass}
                  />
                </Field>
              </div>
            </section>

            {/* Shipping address */}
            <section>
              <h2 className="heading-5 mb-[var(--spacing-5)]">
                Shipping Address{' '}
                <span className="text-[var(--font-size-sm)] text-[var(--color-earth-400)] font-normal">
                  (optional)
                </span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-[var(--spacing-4)]">
                <Field label="Address Line 1" htmlFor="addressLine1">
                  <input
                    id="addressLine1"
                    type="text"
                    value={form.addressLine1}
                    onChange={(e) => set('addressLine1', e.target.value)}
                    autoComplete="address-line1"
                    placeholder="House / flat, street"
                    className={inputClass}
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
                <Field label="City" htmlFor="city">
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    autoComplete="address-level2"
                    placeholder="City"
                    className={inputClass}
                  />
                </Field>
                <Field label="State" htmlFor="state">
                  <select
                    id="state"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
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
                <Field label="Postal Code" htmlFor="postalCode">
                  <input
                    id="postalCode"
                    type="text"
                    inputMode="numeric"
                    value={form.postalCode}
                    onChange={(e) => set('postalCode', e.target.value)}
                    autoComplete="postal-code"
                    placeholder="600001"
                    className={inputClass}
                  />
                </Field>
              </div>
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

            {/* Payment note */}
            <div
              className="rounded-[var(--radius-lg)] p-[var(--spacing-5)] border border-[var(--color-earth-200)]"
              style={{ background: 'var(--color-earth-50)' }}
            >
              <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-2)]">
                Payment Method
              </p>
              <p className="body-small">
                We accept payment via <strong>bank transfer</strong> or <strong>UPI</strong> after
                confirming your order on WhatsApp. No online payment is collected here.
              </p>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div className="flex flex-col gap-[var(--spacing-5)]">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] shadow-[var(--shadow-card)] p-[var(--spacing-5)] sticky top-20">
              <h2 className="heading-5 mb-[var(--spacing-5)]">Order Summary</h2>

              <ul
                className="flex flex-col divide-y divide-[var(--color-earth-100)] mb-[var(--spacing-5)]"
                role="list"
              >
                {items.map((item) => (
                  <li key={item.key} className="flex gap-[var(--spacing-3)] py-[var(--spacing-3)]">
                    <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-earth-100)] shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
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
                        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)] shrink-0">
                      {fmt(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[var(--color-earth-100)] pt-[var(--spacing-4)]">
                <div className="flex justify-between mb-[var(--spacing-1)]">
                  <span className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                    Subtotal
                  </span>
                  <span className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-800)]">
                    {fmt(total)}
                  </span>
                </div>
                <div className="flex justify-between mb-[var(--spacing-4)]">
                  <span className="text-[var(--font-size-sm)] text-[var(--color-earth-600)]">
                    Shipping
                  </span>
                  <span className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
                    Confirmed via WhatsApp
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[var(--font-size-base)] border-t border-[var(--color-earth-200)] pt-[var(--spacing-3)]">
                  <span>Total</span>
                  <span style={{ color: 'var(--color-brand-primary)' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Error */}
              {serverError && (
                <div
                  role="alert"
                  className="mt-[var(--spacing-4)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] text-[var(--color-error)] text-[var(--font-size-sm)]"
                >
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-[var(--spacing-5)] w-full h-12 flex items-center justify-center gap-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
              >
                {submitting ? (
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  'Place Order'
                )}
              </button>

              <p className="mt-[var(--spacing-3)] text-center text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
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
