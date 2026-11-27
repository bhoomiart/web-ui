export const instant = false;
/**
 * /custom — Custom Creations (A5-T5-3)
 */

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';

export const metadata: Metadata = {
  title: 'Custom Creations',
  description:
    'Commission a bespoke handcrafted terracotta piece from Bhoomi Art. Personal gifts, home décor, corporate gifts — crafted to your vision.',
  openGraph: { title: 'Custom Creations — Bhoomi Art', url: `${siteUrl}/custom` },
  alternates: { canonical: `${siteUrl}/custom` },
};

const CUSTOM_TYPES = [
  {
    emoji: '🎁',
    title: 'Personalised Gifts',
    description:
      'Handcrafted pieces with custom engravings, names, or messages — perfect for weddings, housewarming, and special occasions.',
  },
  {
    emoji: '🏡',
    title: 'Home Décor',
    description:
      'Bespoke pots, planters, sculptures, and wall art designed to complement your space.',
  },
  {
    emoji: '🏢',
    title: 'Corporate Gifts',
    description:
      'Branded or unbranded sets that make thoughtful, memorable gifts for clients and teams.',
  },
  {
    emoji: '🎨',
    title: 'Art Commissions',
    description:
      'Collaborate with our artisans on a one-of-a-kind sculptural work — your concept, their craft.',
  },
];

export default function CustomPage() {
  const message = encodeURIComponent(
    'Hi Bhoomi Art! I am interested in a custom creation. Could you help me understand the process and pricing?'
  );

  return (
    <div>
      {/* Hero */}
      <div
        className="min-h-[280px] flex items-end pb-[var(--spacing-12)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-brand-clay) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: 'Custom Creations' }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">Custom Creations</h1>
          <p className="body-large text-[var(--color-earth-200)] mt-[var(--spacing-3)] max-w-2xl">
            Your vision, crafted by hand. Tell us what you imagine.
          </p>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-16)]">
        <div className="max-w-3xl mb-[var(--spacing-16)]">
          <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
            Made for You
          </p>
          <h2 className="heading-2 mb-[var(--spacing-6)]">Something Truly Yours</h2>
          <p className="body-large text-[var(--color-earth-700)]">
            Beyond our regular collection, Bhoomi Art offers fully bespoke pieces — crafted from
            scratch to your specifications. Whether it&apos;s a gift for a loved one, a statement
            piece for your home, or a branded set for your business, our artisans will work with you
            to bring your idea to life.
          </p>
        </div>

        {/* Types of custom work */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-6)] mb-[var(--spacing-16)]">
          {CUSTOM_TYPES.map((type) => (
            <div
              key={type.title}
              className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-earth-200)] p-[var(--spacing-6)] shadow-[var(--shadow-card)]"
            >
              <span
                className="text-[var(--font-size-3xl)] mb-[var(--spacing-4)] block"
                aria-hidden="true"
              >
                {type.emoji}
              </span>
              <h3 className="heading-5 mb-[var(--spacing-2)]">{type.title}</h3>
              <p className="body-small">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Process */}
        <div className="mb-[var(--spacing-16)]">
          <h2 className="heading-3 mb-[var(--spacing-8)]">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-[var(--spacing-6)]">
            {[
              {
                n: '01',
                title: 'Start the Conversation',
                desc: 'Message us on WhatsApp with your idea, reference images, and rough dimensions or use case.',
              },
              {
                n: '02',
                title: 'Design & Quote',
                desc: 'We discuss the concept, share design sketches or examples, and confirm pricing and lead time.',
              },
              {
                n: '03',
                title: 'Craft & Deliver',
                desc: 'Our artisans get to work. We share progress updates and deliver your piece when ready.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-[var(--spacing-4)]">
                <span className="text-[var(--font-size-4xl)] font-bold text-[var(--color-earth-200)] font-serif leading-none shrink-0">
                  {step.n}
                </span>
                <div>
                  <h3 className="heading-5 mb-[var(--spacing-2)]">{step.title}</h3>
                  <p className="body-small">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="p-[var(--spacing-10)] rounded-[var(--radius-2xl)] text-center"
          style={{ background: 'var(--color-brand-sand)' }}
        >
          <h2 className="heading-3 mb-[var(--spacing-4)]">Ready to Start?</h2>
          <p className="body-large text-[var(--color-earth-700)] mb-[var(--spacing-8)] max-w-xl mx-auto">
            The quickest way to begin is a WhatsApp message. Tell us your idea and we&apos;ll take
            it from there.
          </p>
          <a
            href={`https://wa.me/${whatsapp}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[var(--spacing-3)] px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-button)] bg-[var(--color-forest-500)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-forest-600)] transition-colors shadow-[var(--shadow-button-green)]"
          >
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Start Your Custom Order
          </a>
        </div>
      </div>
    </div>
  );
}
