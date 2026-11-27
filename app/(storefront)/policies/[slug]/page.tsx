export const instant = false;
/**
 * /policies/[slug] — shipping, returns, privacy, terms.
 * Admin can override each by publishing a `pages` row with the matching `pageSlug`.
 * The fallback text is a generic placeholder and should be reviewed before launch.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

const POLICIES: Record<string, { title: string; pageSlug: string; paragraphs: string[] }> = {
  shipping: {
    title: 'Shipping Policy',
    pageSlug: 'shipping-policy',
    paragraphs: [
      'Each Bhoomi Art piece is handcrafted and packed with care. Delivery timelines and charges are confirmed with you on WhatsApp when your order is accepted.',
      'Made-to-order and customized pieces take longer to prepare. We will share an estimated dispatch date with you.',
      'You can track your order any time on the Track Order page using your phone number and order number.',
    ],
  },
  returns: {
    title: 'Returns & Refunds',
    pageSlug: 'returns-policy',
    paragraphs: [
      'If your order arrives damaged or is not what you ordered, contact us on WhatsApp with photos as soon as possible and we will help.',
      'Return requests can be raised for delivered orders. Approved returns are refunded after we receive and inspect the item.',
      'Customized and made-to-order pieces may not be eligible for return unless they arrive damaged.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    pageSlug: 'privacy-policy',
    paragraphs: [
      'We collect the details you give us at checkout (name, phone, email, address) only to process and deliver your order and to contact you about it.',
      'We do not sell your personal information. Details are shared only with the people needed to fulfil your order, such as delivery partners.',
      'To ask about or request removal of your data, contact us on WhatsApp or by email.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    pageSlug: 'terms-and-conditions',
    paragraphs: [
      'By placing an order with Bhoomi Art you agree to these terms. Orders are confirmed only after we acknowledge them.',
      'Our pieces are handmade from natural terracotta, so small variations in colour, texture and size are normal and part of their character.',
      'Prices and availability may change. If an item becomes unavailable after you order, we will contact you with options.',
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return {};
  const url = `${siteUrl}/policies/${slug}`;
  return {
    title: policy.title,
    description: `${policy.title} — Bhoomi Art.`,
    openGraph: { title: `${policy.title} — Bhoomi Art`, url },
    alternates: { canonical: url },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <ContentPage
      slug={policy.pageSlug}
      title={policy.title}
      fallback={
        <>
          {policy.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </>
      }
    />
  );
}
