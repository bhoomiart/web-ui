export const instant = false;
/**
 * /order/[number] — Order confirmation page (A6-T3-1)
 *
 * Shows order summary + WhatsApp deep-link to contact admin.
 * Also serves as the landing page after checkout.
 *
 * NOTE: This page is accessible without auth — it only shows
 * the order number and a WhatsApp link. The full order detail
 * is behind /track (phone + order number lookup).
 */

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';
  const message = encodeURIComponent(
    `Hi! I just placed an order on Bhoomi Art. My order number is ${number}. Please confirm my order and share payment details.`
  );
  const waUrl = `https://wa.me/${whatsapp}?text=${message}`;

  return (
    <div className="container-brand py-[var(--spacing-16)] max-w-xl mx-auto text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-[var(--spacing-6)]">
        <svg
          aria-hidden="true"
          className="w-10 h-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="heading-2 mb-[var(--spacing-3)]">Order Placed!</h1>
      <p className="body-large text-[var(--color-earth-600)] mb-[var(--spacing-2)]">
        Thank you for your order.
      </p>
      <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] mb-[var(--spacing-8)]">
        Order number:{' '}
        <span className="font-mono font-bold text-[var(--color-earth-800)]">{number}</span>
      </p>

      {/* WhatsApp CTA */}
      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-6)] mb-[var(--spacing-8)]">
        <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-2)]">
          Next step: confirm on WhatsApp
        </p>
        <p className="body-small text-[var(--color-earth-600)] mb-[var(--spacing-5)]">
          We confirm orders and share payment details over WhatsApp. Click below to send us your
          order number — we reply within a few hours.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[var(--spacing-3)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-forest-500)] text-white font-bold hover:bg-[var(--color-forest-600)] transition-colors shadow-[var(--shadow-button-green)]"
        >
          <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Confirm on WhatsApp
        </a>
      </div>

      {/* Track order link */}
      <div className="flex flex-col sm:flex-row gap-[var(--spacing-3)] justify-center">
        <Link
          href={`/track?order=${encodeURIComponent(number)}`}
          className="inline-flex items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold text-[var(--font-size-sm)] hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Track Order
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-5)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--color-earth-700)] font-semibold text-[var(--font-size-sm)] hover:border-[var(--color-earth-400)] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
