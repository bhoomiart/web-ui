export const instant = false;
/**
 * /craft — The Art of Terracotta (A5-T5-2)
 */

import Link from 'next/link';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';

export const metadata: Metadata = {
  title: 'The Art of Terracotta',
  description:
    'Discover how Bhoomi Art creates handcrafted terracotta pottery — from sourcing natural clay to kiln-firing and hand-finishing each piece.',
  openGraph: { title: 'The Art of Terracotta — Bhoomi Art', url: `${siteUrl}/craft` },
  alternates: { canonical: `${siteUrl}/craft` },
};

const STEPS = [
  {
    number: '01',
    title: 'The Earth',
    description:
      'We source natural terracotta clay from trusted suppliers who extract it responsibly. The clay is selected for its mineral composition, which gives each piece its distinctive warm, reddish hue.',
  },
  {
    number: '02',
    title: 'The Shaping',
    description:
      'Each form is hand-thrown on a wheel or coil-built by artisans who have honed their craft over decades. No two pieces are identical — slight variations are the hallmark of genuine handmade work.',
  },
  {
    number: '03',
    title: 'The Drying',
    description:
      'Shaped pieces are dried slowly at room temperature to prevent cracking. This process can take days, depending on the thickness and humidity.',
  },
  {
    number: '04',
    title: 'The Bisque Fire',
    description:
      'A first firing hardens the clay and prepares it for glazing or surface work. This bisque stage typically reaches 900–1000°C.',
  },
  {
    number: '05',
    title: 'The Finish',
    description:
      'Pieces are hand-painted, burnished, or left in their natural state. We use natural pigments and glazes where possible, keeping our finishes as close to the earth as the clay itself.',
  },
  {
    number: '06',
    title: 'The Final Fire',
    description:
      'A second, final firing seals the finish and brings out the warmth terracotta is known for. Each piece emerges from the kiln unique — shaped by heat, time, and the hands of its maker.',
  },
];

export default function CraftPage() {
  return (
    <div>
      {/* Hero */}
      <div
        className="min-h-[280px] flex items-end pb-[var(--spacing-12)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-700) 0%, var(--color-earth-900) 100%)',
        }}
      >
        <div className="container-brand">
          <BreadcrumbNav
            items={[{ label: 'Home', href: '/' }, { label: 'The Craft' }]}
            className="mb-[var(--spacing-4)] [&_a]:text-[var(--color-earth-300)]"
          />
          <h1 className="heading-1 text-white">The Art of Terracotta</h1>
          <p className="body-large text-[var(--color-earth-200)] mt-[var(--spacing-3)] max-w-2xl">
            From the earth to your home — the journey of every Bhoomi Art piece.
          </p>
        </div>
      </div>

      <div className="container-brand py-[var(--spacing-16)] max-w-4xl">
        {/* Intro */}
        <div className="mb-[var(--spacing-16)]">
          <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
            Our Process
          </p>
          <h2 className="heading-2 mb-[var(--spacing-6)]">Crafted by Hand. Born with Love.</h2>
          <p className="body-large text-[var(--color-earth-700)]">
            Terracotta is one of humanity&apos;s oldest materials. For thousands of years, potters
            have shaped clay into forms both functional and beautiful. At Bhoomi Art, we honour that
            tradition — not as a museum piece, but as a living practice, carried forward by artisans
            who bring their own creativity and mastery to every piece they make.
          </p>
        </div>

        {/* Process steps */}
        <div className="space-y-[var(--spacing-10)]">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="grid sm:grid-cols-[80px_1fr] gap-[var(--spacing-6)] items-start"
            >
              <div className="text-[var(--font-size-5xl)] font-bold text-[var(--color-earth-200)] font-serif leading-none">
                {step.number}
              </div>
              <div>
                <h3 className="heading-4 mb-[var(--spacing-3)]">{step.title}</h3>
                <p className="body-base text-[var(--color-earth-700)]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-[var(--spacing-16)] p-[var(--spacing-8)] rounded-[var(--radius-2xl)]"
          style={{ background: 'var(--color-brand-sand)' }}
        >
          <h2 className="heading-3 mb-[var(--spacing-4)]">Experience the Craft</h2>
          <p className="body-base text-[var(--color-earth-700)] mb-[var(--spacing-6)]">
            Every piece in our shop is a product of this process — made with patience, skill, and a
            deep respect for the material. Browse our collection and bring a piece of this tradition
            into your home.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
