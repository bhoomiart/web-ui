export const instant = false;
/** /account/payments: placeholder until saved payment methods are built. */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Methods',
  robots: { index: false },
};

export default function PaymentMethodsPage() {
  return (
    <div>
      <h1 className="heading-2 mb-[var(--spacing-2)]">Payment Methods</h1>
      <div className="bg-white rounded-[var(--radius-xl)] border border-dashed border-[var(--color-earth-300)] p-[var(--spacing-8)] text-center">
        <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-2)]">
          Coming soon
        </p>
        <p className="body-small text-[var(--color-earth-600)]">
          Saved payment methods are planned for a later release. For now we confirm payment with you
          over WhatsApp after you place an order.
        </p>
      </div>
    </div>
  );
}
