export const instant = false;
/**
 * Homepage — /
 *
 * Renders sections driven by the `homepage_sections` table visibility settings.
 * Each section is independently fetched so a missing DB record just skips it.
 *
 * Sections (in order):
 *   hero               — banners carousel / hero slide
 *   brand_intro        — Bhoomi Art brand story intro
 *   featured_categories — category grid
 *   featured_products  — featured products row
 *   signature          — signature collection highlight
 *   bestsellers        — bestseller products row
 *   new_arrivals       — new arrivals products row
 *   customized         — custom creations CTA
 *   craftsmanship      — brand story / craft section
 *   testimonials       — customer testimonials (placeholder until A7-T1)
 *   whatsapp_cta       — floating WhatsApp button (always visible in layout,
 *                        this section renders an inline CTA block too)
 *
 * generateMetadata: OG, title, description from site_settings.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { listFeaturedProducts, listNewArrivals, listBestsellers } from '@/lib/db/products';
import { getCategoriesWithSubcategories } from '@/lib/db/categories';
import { ProductCard } from '@/components/storefront/ProductCard';
import type { Metadata } from 'next';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'site_description', 'og_image_url', 'site_url']);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  const title = settings.site_name ?? 'Bhoomi Art — Handcrafted Terracotta';
  const description =
    settings.site_description ??
    'Discover handcrafted terracotta pottery and earthenware by Bhoomi Art — rooted in earth, shaped by hand.';
  const siteUrl = settings.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
  const ogImage = settings.og_image_url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: siteUrl,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical: siteUrl },
  };
}

// ─── Homepage page ─────────────────────────────────────────────────────────────

export default async function Homepage() {
  const supabase = await createClient();

  // Fetch sections visibility + banners in parallel
  const [{ data: sections }, { data: banners }] = await Promise.all([
    supabase
      .from('homepage_sections')
      .select('section_key, is_visible, display_order, config')
      .order('display_order', { ascending: true }),
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ]);

  // Build a quick visibility map
  const visibility: Record<string, boolean> = {};
  for (const s of sections ?? []) {
    visibility[s.section_key] = s.is_visible;
  }

  // If no sections data at all, default everything visible
  const show = (key: string) =>
    sections == null || visibility[key] === undefined ? true : visibility[key];

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      {show('hero') && <HeroSection banners={banners ?? []} />}

      {/* ── Brand Intro ──────────────────────────────────────── */}
      {show('brand_intro') && <BrandIntroSection />}

      {/* ── Featured Categories ───────────────────────────────── */}
      {show('featured_categories') && (
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedCategoriesSection />
        </Suspense>
      )}

      {/* ── Featured Products ────────────────────────────────── */}
      {show('featured_products') && (
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedProductsSection />
        </Suspense>
      )}

      {/* ── Signature Collection ─────────────────────────────── */}
      {show('signature') && <SignatureSection />}

      {/* ── Bestsellers ──────────────────────────────────────── */}
      {show('bestsellers') && (
        <Suspense fallback={<SectionSkeleton />}>
          <BestsellersSection />
        </Suspense>
      )}

      {/* ── New Arrivals ─────────────────────────────────────── */}
      {show('new_arrivals') && (
        <Suspense fallback={<SectionSkeleton />}>
          <NewArrivalsSection />
        </Suspense>
      )}

      {/* ── Custom Creations CTA ─────────────────────────────── */}
      {show('customized') && <CustomizedSection />}

      {/* ── Craftsmanship Story ───────────────────────────────── */}
      {show('craftsmanship') && <CraftsmanshipSection />}

      {/* ── WhatsApp CTA ─────────────────────────────────────── */}
      {show('whatsapp_cta') && <WhatsAppCtaSection />}
    </div>
  );
}

// ─── Section skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <section className="py-[var(--spacing-16)]">
      <div className="container-brand">
        <div className="h-8 w-48 bg-[var(--color-earth-100)] rounded-[var(--radius-md)] mb-[var(--spacing-8)] animate-pulse-soft" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-6)]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-[var(--color-earth-100)] rounded-[var(--radius-image)] animate-pulse-soft"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  is_active: boolean;
  display_order: number;
};

function HeroSection({ banners }: { banners: Banner[] }) {
  // If no banners, show a solid brand-colour placeholder hero
  if (banners.length === 0) {
    return (
      <section
        aria-label="Hero"
        className="relative flex items-center justify-center min-h-[520px] md:min-h-[640px] overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, var(--color-earth-800) 0%, var(--color-brand-primary) 100%)',
        }}
      >
        <div className="container-brand text-center relative z-10">
          <p className="label-uppercase text-[var(--color-earth-300)] mb-[var(--spacing-4)]">
            Handcrafted Earthenware
          </p>
          <h1 className="heading-1 text-white mb-[var(--spacing-6)]">
            Rooted in Earth.
            <br />
            Shaped by Hand.
          </h1>
          <p className="body-large text-[var(--color-earth-200)] mb-[var(--spacing-8)] max-w-xl mx-auto">
            Each piece from Bhoomi Art is a celebration of terracotta — the original material,
            touched by fire, shaped by love.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-button)] bg-white text-[var(--color-brand-primary)] font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-100)] transition-colors shadow-[var(--shadow-button)]"
          >
            Shop the Collection
          </Link>
        </div>
      </section>
    );
  }

  // Single banner (simple, no JS carousel — accessibility + performance)
  const hero = banners[0];
  return (
    <section aria-label="Hero" className="relative overflow-hidden min-h-[520px] md:min-h-[640px]">
      <div className="relative w-full min-h-[520px] md:min-h-[640px]">
        <Image
          src={hero.image_url}
          alt={hero.title ?? 'Bhoomi Art hero'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[var(--color-brand-charcoal)]/40" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-brand">
          <div className="max-w-2xl animate-float-up">
            {hero.title && (
              <h1 className="heading-1 text-white mb-[var(--spacing-4)]">{hero.title}</h1>
            )}
            {hero.subtitle && (
              <p className="body-large text-[var(--color-earth-200)] mb-[var(--spacing-8)]">
                {hero.subtitle}
              </p>
            )}
            {hero.cta_text && hero.cta_url && (
              <Link
                href={hero.cta_url}
                className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-bold text-[var(--font-size-base)] hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)]"
              >
                {hero.cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Brand Intro ──────────────────────────────────────────────────────────────

function BrandIntroSection() {
  return (
    <section
      aria-labelledby="brand-intro-heading"
      className="py-[var(--spacing-16)] md:py-[var(--spacing-20)]"
      style={{ background: 'var(--color-brand-ivory)' }}
    >
      <div className="container-brand text-center max-w-3xl mx-auto">
        <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
          Our Story
        </p>
        <h2 id="brand-intro-heading" className="heading-2 mb-[var(--spacing-6)]">
          Born from the Earth
        </h2>
        <p className="body-large text-[var(--color-earth-700)] mb-[var(--spacing-8)]">
          Bhoomi Art is a celebration of terracotta — the most ancient of materials. Every piece is
          handcrafted by skilled artisans who pour generations of knowledge and love into each form.
          We believe in the beauty of imperfection, the warmth of natural textures, and the story
          every piece of earth can tell.
        </p>
        <div className="flex flex-wrap justify-center gap-[var(--spacing-4)]">
          <Link
            href="/about"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
          >
            Our Story
          </Link>
          <Link
            href="/craft"
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors"
          >
            The Craft
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Categories ──────────────────────────────────────────────────────

async function FeaturedCategoriesSection() {
  const categories = await getCategoriesWithSubcategories();
  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="categories-heading"
      className="py-[var(--spacing-16)] md:py-[var(--spacing-20)]"
    >
      <div className="container-brand">
        <div className="text-center mb-[var(--spacing-10)]">
          <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-2)]">
            Browse by Category
          </p>
          <h2 id="categories-heading" className="heading-2">
            Shop Our Collections
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-earth-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            >
              <div className="aspect-[3/4] relative">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-earth-200)] to-[var(--color-earth-300)]">
                    <span className="text-[var(--color-earth-500)] font-serif text-5xl opacity-30">
                      ✿
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-charcoal)]/70 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-[var(--spacing-4)]">
                <p className="font-semibold text-white text-[var(--font-size-base)] leading-tight">
                  {cat.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Row ─────────────────────────────────────────────────────────────

function ProductRow({
  id,
  label,
  title,
  products,
  viewAllHref,
}: {
  id: string;
  label: string;
  title: string;
  products: Parameters<typeof ProductCard>[0]['product'][];
  viewAllHref: string;
}) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="py-[var(--spacing-16)] md:py-[var(--spacing-20)]"
    >
      <div className="container-brand">
        <div className="flex items-end justify-between mb-[var(--spacing-8)]">
          <div>
            <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-1)]">
              {label}
            </p>
            <h2 id={`${id}-heading`} className="heading-2">
              {title}
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:inline-flex items-center gap-[var(--spacing-1)] text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            View all
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h10m-4-4l4 4-4 4" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>

        <div className="mt-[var(--spacing-8)] text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-earth-50)] transition-colors text-[var(--font-size-sm)]"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────

async function FeaturedProductsSection() {
  const products = await listFeaturedProducts(8);
  return (
    <ProductRow
      id="featured"
      label="Handpicked"
      title="Featured Pieces"
      products={products}
      viewAllHref="/shop?collection=featured"
    />
  );
}

// ─── Signature ───────────────────────────────────────────────────────────────

function SignatureSection() {
  return (
    <section
      aria-labelledby="signature-heading"
      className="py-[var(--spacing-20)]"
      style={{
        background:
          'linear-gradient(135deg, var(--color-earth-800) 0%, var(--color-earth-900) 100%)',
      }}
    >
      <div className="container-brand text-center">
        <p className="label-uppercase text-[var(--color-earth-400)] mb-[var(--spacing-4)]">
          Exclusive
        </p>
        <h2 id="signature-heading" className="heading-2 text-white mb-[var(--spacing-6)]">
          The Signature Collection
        </h2>
        <p className="body-large text-[var(--color-earth-300)] mb-[var(--spacing-8)] max-w-xl mx-auto">
          Our most distinctive pieces — each one a named work, bearing the mark of its maker.
          Limited quantities, crafted for those who seek something truly unique.
        </p>
        <Link
          href="/shop?collection=signature"
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-button)] border border-white text-white font-semibold hover:bg-white hover:text-[var(--color-earth-900)] transition-colors"
        >
          Explore Signature Pieces
        </Link>
      </div>
    </section>
  );
}

// ─── Bestsellers ──────────────────────────────────────────────────────────────

async function BestsellersSection() {
  const products = await listBestsellers(8);
  return (
    <ProductRow
      id="bestsellers"
      label="Most Loved"
      title="Best Sellers"
      products={products}
      viewAllHref="/shop?collection=bestsellers"
    />
  );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────

async function NewArrivalsSection() {
  const products = await listNewArrivals(8);
  return (
    <ProductRow
      id="new-arrivals"
      label="Just In"
      title="New Arrivals"
      products={products}
      viewAllHref="/shop?collection=new-arrivals"
    />
  );
}

// ─── Custom Creations ─────────────────────────────────────────────────────────

function CustomizedSection() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';
  const message = encodeURIComponent(
    'Hi Bhoomi Art! I am interested in a custom creation. Could you help me?'
  );

  return (
    <section
      aria-labelledby="custom-heading"
      className="py-[var(--spacing-16)] md:py-[var(--spacing-20)]"
      style={{ background: 'var(--color-brand-sand)' }}
    >
      <div className="container-brand grid md:grid-cols-2 gap-[var(--spacing-12)] items-center">
        <div>
          <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
            Made for You
          </p>
          <h2 id="custom-heading" className="heading-2 mb-[var(--spacing-6)]">
            Custom Creations
          </h2>
          <p className="body-large text-[var(--color-earth-700)] mb-[var(--spacing-8)]">
            Looking for something personal? We collaborate with you to craft pieces that carry your
            vision — from personalised gifts to bespoke home décor. Tell us what you imagine.
          </p>
          <div className="flex flex-wrap gap-[var(--spacing-4)]">
            <Link
              href="/custom"
              className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-earth-700)] transition-colors"
            >
              Explore Custom Work
            </Link>
            <a
              href={`https://wa.me/${whatsapp}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-semibold hover:bg-white transition-colors"
            >
              {/* WhatsApp icon */}
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enquire via WhatsApp
            </a>
          </div>
        </div>
        {/* Decorative right side — terracotta palette illustration */}
        <div className="hidden md:flex items-center justify-center">
          <div className="w-80 h-80 rounded-full bg-[var(--color-earth-200)] flex items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--font-size-7xl)] leading-none opacity-40">🏺</p>
              <p className="label-uppercase text-[var(--color-earth-500)] mt-[var(--spacing-4)]">
                Your Vision
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Craftsmanship ────────────────────────────────────────────────────────────

function CraftsmanshipSection() {
  return (
    <section
      aria-labelledby="craft-heading"
      className="py-[var(--spacing-16)] md:py-[var(--spacing-24)]"
      style={{ background: 'var(--color-earth-50)' }}
    >
      <div className="container-brand grid md:grid-cols-2 gap-[var(--spacing-12)] items-center">
        {/* Text */}
        <div className="order-2 md:order-1">
          <p className="label-uppercase text-[var(--color-brand-primary)] mb-[var(--spacing-4)]">
            Our Process
          </p>
          <h2 id="craft-heading" className="heading-2 mb-[var(--spacing-6)]">
            Crafted by Hand.
            <br />
            Born with Love.
          </h2>
          <div className="space-y-[var(--spacing-4)]">
            {[
              {
                n: '01',
                title: 'The Earth',
                desc: 'We source natural terracotta clay, chosen for its texture and mineral richness.',
              },
              {
                n: '02',
                title: 'The Shaping',
                desc: 'Each form is hand-thrown or coil-built by artisans who have honed their craft over decades.',
              },
              {
                n: '03',
                title: 'The Fire',
                desc: 'Kiln-fired at precise temperatures to bring out the warm, earthy tones terracotta is known for.',
              },
              {
                n: '04',
                title: 'The Finish',
                desc: 'Hand-painted, burnished, or left natural — each piece is finished with intention.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-[var(--spacing-4)]">
                <span className="text-[var(--font-size-2xl)] font-bold text-[var(--color-earth-200)] shrink-0 font-serif leading-none">
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-[var(--color-earth-800)] mb-[var(--spacing-1)]">
                    {step.title}
                  </p>
                  <p className="body-small">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/craft"
            className="mt-[var(--spacing-8)] inline-flex items-center gap-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            Read the full story →
          </Link>
        </div>

        {/* Visual */}
        <div className="order-1 md:order-2 relative">
          <div className="aspect-[4/5] rounded-[var(--radius-2xl)] overflow-hidden bg-[var(--color-earth-200)]">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg viewBox="0 0 200 200" className="w-full h-full text-[var(--color-earth-500)]">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 6"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--spacing-4)] text-center p-[var(--spacing-8)]">
              <p className="text-[var(--font-size-5xl)] opacity-30">🏺</p>
              <p className="heading-5 text-[var(--color-earth-600)]">Art from the Earth</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WhatsApp CTA ─────────────────────────────────────────────────────────────

function WhatsAppCtaSection() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';
  const message = encodeURIComponent('Hi! I found you on Bhoomi Art and have a question.');

  return (
    <section
      aria-labelledby="whatsapp-cta-heading"
      className="py-[var(--spacing-16)]"
      style={{ background: 'var(--color-forest-500)' }}
    >
      <div className="container-brand flex flex-col sm:flex-row items-center justify-between gap-[var(--spacing-6)]">
        <div>
          <h2 id="whatsapp-cta-heading" className="heading-4 text-white mb-[var(--spacing-2)]">
            Have a question? Chat with us on WhatsApp.
          </h2>
          <p className="body-small text-[var(--color-forest-100)]">
            We reply within a few hours — Monday to Saturday, 9 AM to 7 PM IST.
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsapp}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-[var(--spacing-3)] px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-button)] bg-white text-[var(--color-forest-500)] font-bold hover:bg-[var(--color-forest-50)] transition-colors shadow-[var(--shadow-button-green)]"
        >
          <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}
