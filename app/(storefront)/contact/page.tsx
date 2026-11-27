export const instant = false;
/**
 * /contact — Contact Us (A5-T5-4)
 */

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Bhoomi Art. WhatsApp, email, or Instagram — we love hearing from you.',
  openGraph: { title: 'Contact Us — Bhoomi Art', url: `${siteUrl}/contact` },
  alternates: { canonical: `${siteUrl}/contact` },
};

export default function ContactPage() {
  const waMessage = encodeURIComponent('Hi Bhoomi Art! I have a question.');

  return (
    <div>
      {/* Hero */}
      <div
        className="min-h-[220px] flex items-end pb-[var(--spacing-10)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-700) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">Contact Us</h1>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-16)]">
        <div className="max-w-2xl">
          <p className="body-large text-[var(--color-earth-700)] mb-[var(--spacing-10)]">
            We&apos;d love to hear from you — whether you have a question about a product, need help
            with an order, or want to discuss a custom creation.
          </p>

          <div className="space-y-[var(--spacing-6)]">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[var(--spacing-5)] p-[var(--spacing-6)] rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] bg-white hover:border-[var(--color-forest-400)] hover:shadow-[var(--shadow-card-hover)] transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-forest-100)] flex items-center justify-center shrink-0">
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-[var(--color-forest-500)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-earth-900)] mb-[var(--spacing-1)]">
                  WhatsApp
                </p>
                <p className="body-small group-hover:text-[var(--color-forest-500)]">
                  +91 70194 00775 · Mon–Sat, 9 AM–7 PM IST
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:ba4bhoomiart@gmail.com"
              className="flex items-center gap-[var(--spacing-5)] p-[var(--spacing-6)] rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] bg-white hover:border-[var(--color-brand-primary)] hover:shadow-[var(--shadow-card-hover)] transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-earth-100)] flex items-center justify-center shrink-0">
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-[var(--color-brand-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-earth-900)] mb-[var(--spacing-1)]">
                  Email
                </p>
                <p className="body-small group-hover:text-[var(--color-brand-primary)]">
                  ba4bhoomiart@gmail.com
                </p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/ba4bhoomiart"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[var(--spacing-5)] p-[var(--spacing-6)] rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] bg-white hover:border-[var(--color-brand-primary)] hover:shadow-[var(--shadow-card-hover)] transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-earth-100)] flex items-center justify-center shrink-0">
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-[var(--color-brand-primary)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-earth-900)] mb-[var(--spacing-1)]">
                  Instagram
                </p>
                <p className="body-small group-hover:text-[var(--color-brand-primary)]">
                  @ba4bhoomiart
                </p>
              </div>
            </a>
          </div>

          <div className="mt-[var(--spacing-10)] p-[var(--spacing-6)] rounded-[var(--radius-xl)] bg-[var(--color-earth-50)] border border-[var(--color-earth-100)]">
            <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-2)]">
              Response Times
            </p>
            <p className="body-small">
              We aim to respond to all messages within a few hours during business hours (Mon–Sat, 9
              AM–7 PM IST). WhatsApp is the fastest way to reach us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
