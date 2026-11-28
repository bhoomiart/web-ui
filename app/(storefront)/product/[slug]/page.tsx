export const instant = false;
/**
 * /product/[slug] — Product detail page (A5-T4)
 *
 * SSR with generateMetadata, Schema.org Product JSON-LD.
 * Gallery, variant selector (client), add-to-cart (wired A6-T1),
 * restock subscribe form (wired to /api/restock/subscribe),
 * reviews section, recommendations.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getProductRecommendations } from '@/lib/db/products';
import { listProductReviews, getProductRatingSummary } from '@/lib/db/reviews';
import { getStockForProducts } from '@/lib/cart/stock';
import type { StockInfo } from '@/lib/cart/types';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { PhotoThumbs } from '@/components/PhotoThumbs';
import { ProductGallery } from './ProductGallery';
import { AddToCartSection } from './AddToCartSection';
import { ProductViewTracker } from './ProductViewTracker';
import { RestockSubscribeForm } from './RestockSubscribeForm';
import type { Metadata } from 'next';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
  const title = product.seo_title ?? product.name;
  const ogTitle = `${title} — Bhoomi Art`;
  const description =
    product.seo_description ??
    product.short_description ??
    `Shop ${product.name} — handcrafted terracotta by Bhoomi Art.`;
  const canonical = `${siteUrl}/product/${product.seo_slug ?? slug}`;

  const media = [...(product.product_media ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const ogImage = product.og_image_url ?? media[0]?.url ?? null;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [ratingSummary, reviews, relatedRecs, alsoLikeRecs, stockMap] = await Promise.all([
    getProductRatingSummary(product.id),
    listProductReviews(product.id, 'newest', 5),
    getProductRecommendations(product.id, 'related', 4),
    getProductRecommendations(product.id, 'you_may_also_like', 4),
    // Live availability, rendered on the server so the page never flashes the wrong state.
    // A failure here must not break the page: the client refetches and the server re-checks every add.
    getStockForProducts([product.id]).catch(() => ({})),
  ]);

  const media = [...(product.product_media ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const images = media.filter((m) => m.media_type === 'image');
  const video = media.find((m) => m.media_type === 'video') ?? null;

  // Breadcrumb: derive from first category if available
  type CatMap = {
    category_id: string;
    categories: { id: string; name: string; slug: string } | null;
  };
  const categoryMaps = (product.product_category_map ?? []) as unknown as CatMap[];
  const firstCat = categoryMaps[0]?.categories ?? null;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    ...(firstCat ? [{ label: firstCat.name, href: `/category/${firstCat.slug}` }] : []),
    { label: product.name },
  ];

  const isOutOfStock = product.availability_type === 'out_of_stock';
  const stockInfo: StockInfo | null = (stockMap as Record<string, StockInfo>)[product.id] ?? null;
  // Ready-to-ship product whose last unit just sold: offer "notify me" next to the disabled button.
  const soldOutByStock =
    stockInfo != null && !stockInfo.hasVariants && stockInfo.availableQty === 0;
  const isMadeToOrder = product.availability_type === 'made_to_order';

  // Schema.org Product JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com';
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description ?? undefined,
    url: `${siteUrl}/product/${slug}`,
    ...(images[0] ? { image: images[0].url } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: 'Bhoomi Art' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price ?? 0,
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `${siteUrl}/product/${slug}`,
    },
    ...(ratingSummary.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingSummary.average,
            reviewCount: ratingSummary.count,
          },
        }
      : {}),
  };

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917019400775';
  const waMessage = encodeURIComponent(
    `Hi! I'm interested in "${product.name}" from Bhoomi Art. Could you share more details?`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="container-brand py-[var(--spacing-8)] md:py-[var(--spacing-12)]">
        {/* Breadcrumb */}
        <BreadcrumbNav items={breadcrumbs} className="mb-[var(--spacing-8)]" />

        {/* Main product section */}
        <div className="grid md:grid-cols-2 gap-[var(--spacing-10)] lg:gap-[var(--spacing-16)]">
          {/* Gallery */}
          <ProductGallery images={images} video={video} productName={product.name} />

          {/* Info + actions */}
          <div className="flex flex-col gap-[var(--spacing-6)]">
            {/* Labels */}
            <div className="flex flex-wrap gap-[var(--spacing-2)]">
              {product.is_new_arrival && (
                <span
                  className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold uppercase tracking-wider"
                  style={{
                    color: 'var(--color-success)',
                    background: 'var(--color-success-light)',
                  }}
                >
                  New Arrival
                </span>
              )}
              {product.is_bestseller && (
                <span
                  className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold uppercase tracking-wider"
                  style={{
                    color: 'var(--color-brand-primary)',
                    background: 'var(--color-earth-100)',
                  }}
                >
                  Bestseller
                </span>
              )}
              {product.is_signature && (
                <span
                  className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-bold uppercase tracking-wider"
                  style={{
                    color: 'var(--color-brand-clay)',
                    background: 'var(--color-brand-sand)',
                  }}
                >
                  Signature
                </span>
              )}
            </div>

            {/* Name + SKU */}
            <div>
              <h1 className="heading-2 mb-[var(--spacing-2)]">{product.name}</h1>
              {product.sku && <p className="caption">SKU: {product.sku}</p>}
            </div>

            {/* Rating */}
            {ratingSummary.count > 0 && (
              <div className="flex items-center gap-[var(--spacing-2)]">
                <div className="flex" aria-label={`${ratingSummary.average} out of 5`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill={
                        i <= Math.round(ratingSummary.average)
                          ? 'var(--color-warning)'
                          : 'var(--color-earth-200)'
                      }
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <a
                  href="#reviews"
                  className="text-[var(--font-size-sm)] text-[var(--color-brand-primary)] hover:underline"
                >
                  {ratingSummary.count} review{ratingSummary.count !== 1 ? 's' : ''}
                </a>
              </div>
            )}

            {/* Price */}
            {product.price != null && (
              <div>
                <p
                  className="text-[var(--font-size-3xl)] font-bold"
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(product.price)}
                </p>
                {isMadeToOrder && product.preparation_time && (
                  <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] mt-[var(--spacing-1)]">
                    Made to order · {product.preparation_time}
                  </p>
                )}
              </div>
            )}

            {/* Short description */}
            {product.short_description && (
              <p className="body-base text-[var(--color-earth-700)]">{product.short_description}</p>
            )}

            <ProductViewTracker
              productId={product.id}
              productName={product.name}
              value={product.price ?? undefined}
            />
            {/* Add to cart, plus restock subscribe when nothing is left to buy */}
            {!isOutOfStock && (
              <AddToCartSection
                initialStock={stockInfo}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  availability_type: product.availability_type,
                  image: images[0]?.url ?? null,
                }}
                variants={
                  (product.product_variants ?? []) as Array<{
                    id: string;
                    name: string;
                    sku: string | null;
                    price_modifier: number;
                    attributes: unknown;
                    status: string;
                  }>
                }
              />
            )}
            {(isOutOfStock || soldOutByStock) && (
              <RestockSubscribeForm productId={product.id} productName={product.name} />
            )}

            {/* WhatsApp enquiry */}
            <div className="border-t border-[var(--color-earth-100)] pt-[var(--spacing-5)]">
              <a
                href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[var(--spacing-3)] text-[var(--font-size-sm)] font-semibold text-[var(--color-forest-500)] hover:underline"
              >
                <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Have a question? Chat on WhatsApp
              </a>
            </div>

            {/* Quick specs */}
            {(product.materials || product.dimensions) && (
              <dl className="border-t border-[var(--color-earth-100)] pt-[var(--spacing-5)] grid grid-cols-2 gap-[var(--spacing-3)] text-[var(--font-size-sm)]">
                {product.materials && (
                  <>
                    <dt className="font-semibold text-[var(--color-earth-600)]">Materials</dt>
                    <dd className="text-[var(--color-earth-700)]">{product.materials}</dd>
                  </>
                )}
              </dl>
            )}
          </div>
        </div>

        {/* Long description accordion */}
        {(product.long_description || product.care_instructions || product.story_content) && (
          <section
            aria-label="Product details"
            className="mt-[var(--spacing-16)] border-t border-[var(--color-earth-100)]"
          >
            <h2 className="sr-only">Product Details</h2>
            <div className="divide-y divide-[var(--color-earth-100)]">
              {product.long_description && (
                <details className="py-[var(--spacing-5)] group">
                  <summary className="flex items-center justify-between cursor-pointer heading-5 list-none">
                    Description
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-[var(--color-earth-400)] transition-transform group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                    </svg>
                  </summary>
                  <div className="mt-[var(--spacing-4)] body-base text-[var(--color-earth-700)] whitespace-pre-wrap">
                    {product.long_description}
                  </div>
                </details>
              )}
              {product.care_instructions && (
                <details className="py-[var(--spacing-5)] group">
                  <summary className="flex items-center justify-between cursor-pointer heading-5 list-none">
                    Care Instructions
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-[var(--color-earth-400)] transition-transform group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                    </svg>
                  </summary>
                  <div className="mt-[var(--spacing-4)] body-base text-[var(--color-earth-700)] whitespace-pre-wrap">
                    {product.care_instructions}
                  </div>
                </details>
              )}
              {product.story_content && (
                <details className="py-[var(--spacing-5)] group">
                  <summary className="flex items-center justify-between cursor-pointer heading-5 list-none">
                    The Story Behind This Piece
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-[var(--color-earth-400)] transition-transform group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                    </svg>
                  </summary>
                  <div className="mt-[var(--spacing-4)] body-base text-[var(--color-earth-700)] whitespace-pre-wrap italic">
                    {product.story_content}
                  </div>
                </details>
              )}
            </div>
          </section>
        )}

        {/* Customer Reviews */}
        <section id="reviews" aria-labelledby="reviews-heading" className="mt-[var(--spacing-16)]">
          <h2 id="reviews-heading" className="heading-3 mb-[var(--spacing-8)]">
            Customer Reviews
          </h2>

          {ratingSummary.count === 0 ? (
            <p className="body-base text-[var(--color-earth-500)]">No reviews yet.</p>
          ) : (
            <div className="space-y-[var(--spacing-6)]">
              {reviews.reviews.map((r) => (
                <div
                  key={r.id}
                  className="border-b border-[var(--color-earth-100)] pb-[var(--spacing-6)]"
                >
                  <div className="flex items-center gap-[var(--spacing-3)] mb-[var(--spacing-2)]">
                    <div className="flex" aria-label={`${r.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                          key={i}
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill={i <= r.rating ? 'var(--color-warning)' : 'var(--color-earth-200)'}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold text-[var(--font-size-sm)] text-[var(--color-earth-800)]">
                      {r.customer_name}
                    </span>
                    {r.is_verified_purchase && (
                      <span
                        className="text-[var(--font-size-xs)] font-semibold"
                        style={{ color: 'var(--color-success)' }}
                      >
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  {r.body && <p className="body-base text-[var(--color-earth-700)]">{r.body}</p>}
                  <PhotoThumbs
                    urls={(r.review_media ?? []).map((m) => m.url)}
                    label="Customer review photo"
                  />
                  {/* Admin response */}
                  {r.admin_response && (
                    <div className="mt-[var(--spacing-3)] pl-[var(--spacing-4)] border-l-2 border-[var(--color-earth-200)]">
                      <p className="text-[var(--font-size-xs)] font-semibold text-[var(--color-earth-500)] mb-1">
                        Response from Bhoomi Art
                      </p>
                      <p className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                        {r.admin_response}
                      </p>
                    </div>
                  )}
                  <p className="caption mt-[var(--spacing-2)]">
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-[var(--spacing-8)] text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
            Bought this piece? Once it is delivered you can review it from{' '}
            <Link
              href="/track"
              className="text-[var(--color-brand-primary)] font-semibold hover:underline"
            >
              your order details
            </Link>
            .
          </p>
        </section>

        {/* Related products */}
        {relatedRecs.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-[var(--spacing-16)]">
            <h2 id="related-heading" className="heading-3 mb-[var(--spacing-8)]">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
              {relatedRecs.map((rec) => {
                const p = rec.recommended as unknown as
                  Parameters<typeof ProductCard>[0]['product'] | null;
                if (!p) return null;
                return <ProductCard key={p.id} product={p} />;
              })}
            </div>
          </section>
        )}

        {/* Also like */}
        {alsoLikeRecs.length > 0 && (
          <section aria-labelledby="also-like-heading" className="mt-[var(--spacing-16)]">
            <h2 id="also-like-heading" className="heading-3 mb-[var(--spacing-8)]">
              More from Bhoomi Art
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--spacing-4)] md:gap-[var(--spacing-6)]">
              {alsoLikeRecs.map((rec) => {
                const p = rec.recommended as unknown as
                  Parameters<typeof ProductCard>[0]['product'] | null;
                if (!p) return null;
                return <ProductCard key={p.id} product={p} />;
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
