export const instant = false;
/**
 * /checkout — Checkout page (A6-T2)
 *
 * Client component (needs cart store access).
 * Single-page form: customer info + address + order summary.
 * Submits to POST /api/checkout.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export { CheckoutPageClient as default } from './CheckoutPageClient';
