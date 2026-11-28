/**
 * ProductCard
 *
 * Shared product listing card used by homepage sections, /shop, category pages,
 * search results, and recommendation rows.
 *
 * Server component. The card itself is presentational; the quick add-to-cart
 * and live stock indicator are one small client island (ProductCardActions),
 * so cached listing pages never show stale stock.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ProductCardActions } from './ProductCardActions';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  short_description?: string | null;
  availability_type: 'ready_to_ship' | 'made_to_order' | 'out_of_stock';
  is_new_arrival?: boolean;
  is_bestseller?: boolean;
  is_signature?: boolean;
  is_featured?: boolean;
  product_media: Array<{
    url: string;
    alt_text: string | null;
    media_type?: string;
    display_order?: number;
  }>;
  rating?: number;
  review_count?: number;
}

type CardSize = 'sm' | 'md' | 'lg';

interface ProductCardProps {
  product: ProductCardData;
  size?: CardSize;
  priority?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortedImages(media: ProductCardData['product_media']) {
  return [...media]
    .filter((m) => !m.media_type || m.media_type === 'image')
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

function formatPrice(price: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function AvailabilityBadge({ type }: { type: ProductCardData['availability_type'] }) {
  if (type === 'ready_to_ship') return null; // default — no badge needed

  if (type === 'made_to_order') {
    return (
      <span
        className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-2xs)] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-info)', background: 'var(--color-info-light)' }}
      >
        Made to Order
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-2xs)] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--color-error)', background: 'var(--color-error-light)' }}
    >
      Out of Stock
    </span>
  );
}

function LabelBadges({ product }: { product: ProductCardData }) {
  const labels: Array<{ text: string; color: string; bg: string }> = [];
  if (product.is_new_arrival)
    labels.push({ text: 'New', color: 'var(--color-success)', bg: 'var(--color-success-light)' });
  if (product.is_bestseller)
    labels.push({
      text: 'Bestseller',
      color: 'var(--color-brand-primary)',
      bg: 'var(--color-earth-100)',
    });
  if (product.is_signature)
    labels.push({
      text: 'Signature',
      color: 'var(--color-brand-clay)',
      bg: 'var(--color-brand-sand)',
    });

  if (labels.length === 0) return null;

  return (
    <div className="absolute top-[var(--spacing-2)] left-[var(--spacing-2)] flex flex-col gap-1">
      {labels.map((l) => (
        <span
          key={l.text}
          className="inline-flex px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-2xs)] font-bold uppercase tracking-wider"
          style={{ color: l.color, background: l.bg }}
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div
      className="flex items-center gap-[var(--spacing-1)]"
      aria-label={`Rating: ${rating} out of 5`}
    >
      <div className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className="w-3.5 h-3.5"
            viewBox="0 0 20 20"
            fill={
              i <= full
                ? 'var(--color-warning)'
                : i === full + 1 && half
                  ? 'url(#half)'
                  : 'var(--color-earth-200)'
            }
          >
            {i === full + 1 && half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="var(--color-warning)" />
                  <stop offset="50%" stopColor="var(--color-earth-200)" />
                </linearGradient>
              </defs>
            )}
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count != null && count > 0 && (
        <span className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">({count})</span>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductCard({ product, size = 'md', priority = false }: ProductCardProps) {
  const images = sortedImages(product.product_media);
  const thumb = images[0] ?? null;
  const hover = images[1] ?? null; // second image shown on hover
  const price = formatPrice(product.price);

  const imageSizes: Record<CardSize, string> = {
    sm: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
    md: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    lg: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  };

  const imageAspect: Record<CardSize, string> = {
    sm: 'aspect-[4/3]',
    md: 'aspect-square',
    lg: 'aspect-[3/4]',
  };

  return (
    <article className="group flex flex-col">
      {/* Image block */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden rounded-[var(--radius-image)] bg-[var(--color-earth-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
      >
        <div className={`relative w-full ${imageAspect[size]}`}>
          {thumb ? (
            <>
              <Image
                src={thumb.url}
                alt={thumb.alt_text ?? product.name}
                fill
                sizes={imageSizes[size]}
                className={`object-cover transition-opacity duration-[var(--duration-slow)] ${
                  hover ? 'group-hover:opacity-0' : ''
                }`}
                priority={priority}
              />
              {hover && (
                <Image
                  src={hover.url}
                  alt={hover.alt_text ?? product.name}
                  fill
                  sizes={imageSizes[size]}
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-slow)]"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                aria-hidden="true"
                className="w-12 h-12 text-[var(--color-earth-300)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Label badges (New, Bestseller, Signature) */}
        <LabelBadges product={product} />
      </Link>

      {/* Info block */}
      <div className="flex flex-col gap-[var(--spacing-1)] mt-[var(--spacing-3)] flex-1">
        {/* Name */}
        <Link
          href={`/product/${product.slug}`}
          className="inline-block py-0.5 text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] leading-snug hover:text-[var(--color-brand-primary)] transition-colors focus-visible:outline-none focus-visible:underline"
        >
          {product.name}
        </Link>

        {/* Rating (when provided) */}
        {product.rating != null && product.rating > 0 && (
          <StarRating rating={product.rating} count={product.review_count} />
        )}

        {/* Price + availability */}
        <div className="flex items-center gap-[var(--spacing-2)] mt-auto pt-[var(--spacing-1)]">
          {price ? (
            <span
              className="text-[var(--font-size-base)] font-bold"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              {price}
            </span>
          ) : (
            <span className="text-[var(--font-size-sm)] text-[var(--color-earth-400)]">
              Price on request
            </span>
          )}
          <AvailabilityBadge type={product.availability_type} />
        </div>

        {/* Quick add + live stock */}
        <ProductCardActions
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: thumb?.url ?? null,
            availabilityType: product.availability_type,
          }}
        />
      </div>
    </article>
  );
}
