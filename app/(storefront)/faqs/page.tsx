export const instant = false;
/**
 * /faqs — Frequently asked questions.
 * Admin can override the content by publishing a `pages` row with slug "faqs".
 */

import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Answers to common questions about ordering, shipping and care at Bhoomi Art.',
  openGraph: { title: 'FAQs — Bhoomi Art', url: `${siteUrl}/faqs` },
  alternates: { canonical: `${siteUrl}/faqs` },
};

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Add items to your cart and complete checkout. We confirm your order on WhatsApp, and payment is arranged with us directly.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Use the Track Order page with your phone number and order number.',
  },
  {
    q: 'Do you make custom pieces?',
    a: 'Yes. Message us on WhatsApp or visit the Custom Creations page to describe what you have in mind.',
  },
  {
    q: 'How should I care for terracotta?',
    a: 'Keep it dry when not in use, avoid sudden temperature changes, and wipe with a soft damp cloth.',
  },
  {
    q: 'What if an item arrives damaged?',
    a: 'Contact us on WhatsApp as soon as possible with photos. See our Returns & Refunds policy for details.',
  },
];

export default function FaqsPage() {
  return (
    <ContentPage
      slug="faqs"
      title="Frequently Asked Questions"
      fallback={
        <>
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="border-b border-[var(--color-earth-200)] pb-[var(--spacing-4)]"
            >
              <summary className="cursor-pointer font-semibold text-[var(--color-earth-900)]">
                {f.q}
              </summary>
              <p className="mt-[var(--spacing-3)]">{f.a}</p>
            </details>
          ))}
        </>
      }
    />
  );
}
