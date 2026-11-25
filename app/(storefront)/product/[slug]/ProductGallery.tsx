'use client';

/**
 * ProductGallery (A5-T4-2, A5-T4-3)
 *
 * Image gallery with thumbnail strip and selected-image zoom.
 * Video loads on user interaction (not on page load) per A8-T3-6.
 */

import Image from 'next/image';
import React from 'react';

interface MediaItem {
  id?: string;
  url: string;
  alt_text: string | null;
  media_type?: string;
  display_order?: number;
}

interface ProductGalleryProps {
  images: MediaItem[];
  video: MediaItem | null;
  productName: string;
}

export function ProductGallery({ images, video, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [videoReady, setVideoReady] = React.useState(false);
  const [isVideoActive, setIsVideoActive] = React.useState(false);

  const hasImages = images.length > 0;
  const hasVideo = video != null;
  const totalItems = images.length + (hasVideo ? 1 : 0);

  if (!hasImages && !hasVideo) {
    return (
      <div className="aspect-square rounded-[var(--radius-xl)] bg-[var(--color-earth-100)] flex items-center justify-center">
        <svg
          aria-hidden="true"
          className="w-16 h-16 text-[var(--color-earth-300)]"
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
    );
  }

  const isVideoSlide = isVideoActive && hasVideo;
  const activeImage = images[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-[var(--spacing-4)]">
      {/* Main image / video */}
      <div className="relative aspect-square rounded-[var(--radius-xl)] overflow-hidden bg-[var(--color-earth-100)]">
        {isVideoSlide ? (
          videoReady ? (
            <video
              src={video!.url}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
              aria-label={`${productName} video`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--spacing-4)]">
              <button
                type="button"
                onClick={() => setVideoReady(true)}
                className="w-16 h-16 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center hover:bg-[var(--color-earth-700)] transition-colors shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                aria-label="Play product video"
              >
                <svg
                  aria-hidden="true"
                  className="w-7 h-7 ml-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
                Click to play video
              </p>
            </div>
          )
        ) : activeImage ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt_text ?? productName}
            fill
            className="object-cover"
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : null}
      </div>

      {/* Thumbnails */}
      {totalItems > 1 && (
        <div
          className="flex gap-[var(--spacing-2)] overflow-x-auto pb-1"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={!isVideoActive && activeIndex === i}
              aria-label={`Image ${i + 1}`}
              onClick={() => {
                setActiveIndex(i);
                setIsVideoActive(false);
                setVideoReady(false);
              }}
              className={`relative shrink-0 w-16 h-16 rounded-[var(--radius-md)] overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                !isVideoActive && activeIndex === i
                  ? 'border-[var(--color-brand-primary)]'
                  : 'border-transparent hover:border-[var(--color-earth-300)]'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${productName} image ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}

          {/* Video thumbnail */}
          {hasVideo && (
            <button
              type="button"
              role="tab"
              aria-selected={isVideoActive}
              aria-label="Product video"
              onClick={() => {
                setIsVideoActive(true);
              }}
              className={`relative shrink-0 w-16 h-16 rounded-[var(--radius-md)] overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] bg-[var(--color-earth-200)] flex items-center justify-center ${
                isVideoActive
                  ? 'border-[var(--color-brand-primary)]'
                  : 'border-transparent hover:border-[var(--color-earth-300)]'
              }`}
            >
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-[var(--color-brand-primary)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
