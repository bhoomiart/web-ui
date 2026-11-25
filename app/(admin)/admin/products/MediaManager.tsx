'use client';

/**
 * MediaManager — image/video upload and reorder for a product.
 * Calls POST /api/admin/upload-product-media (upload)
 *       DELETE /api/admin/media/[id] (delete)
 *       PATCH  /api/admin/media/[id] with { items } (reorder)
 * No Server Action imports.
 */

import * as React from 'react';
import Image from 'next/image';

type MediaItem = {
  id: string;
  url: string;
  media_type: string;
  alt_text: string | null;
  display_order: number;
};

interface MediaManagerProps {
  productId: string;
  media: MediaItem[];
}

export function MediaManager({ productId, media: initialMedia }: MediaManagerProps) {
  const [media, setMedia] = React.useState<MediaItem[]>(initialMedia);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList) {
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setError(`${file.name}: unsupported type.`);
        continue;
      }
      if (file.size > 52_428_800) {
        setError(`${file.name}: exceeds 50MB.`);
        continue;
      }

      const form = new FormData();
      form.append('file', file);
      form.append('productId', productId);

      const res = await fetch('/api/admin/upload-product-media', { method: 'POST', body: form });
      const json = (await res.json()) as { url?: string; id?: string; error?: string };

      if (!res.ok || json.error) {
        setError(json.error ?? 'Upload failed.');
        continue;
      }

      setMedia((prev) => [
        ...prev,
        {
          id: json.id!,
          url: json.url!,
          media_type: isVideo ? 'video' : 'image',
          alt_text: null,
          display_order: prev.length,
        },
      ]);
    }

    setUploading(false);
  }

  async function handleDelete(mediaId: string) {
    const res = await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? 'Delete failed.');
      return;
    }
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData('dragIndex', String(index));
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('dragIndex'));
    if (dragIndex === dropIndex) return;

    const reordered = [...media];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((item, i) => ({ ...item, display_order: i }));
    setMedia(withOrder);

    await fetch(`/api/admin/media/bulk`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: withOrder.map((m) => ({ id: m.id, display_order: m.display_order })),
      }),
    });
  }

  return (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)]">
      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Click or drop files to upload"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
        }}
        className="border-2 border-dashed rounded-[var(--radius-lg)] border-[var(--color-earth-200)] hover:border-[var(--color-brand-primary)] flex flex-col items-center justify-center gap-[var(--spacing-2)] py-[var(--spacing-8)] px-[var(--spacing-4)] cursor-pointer transition-colors"
      >
        <svg
          className="w-8 h-8 text-[var(--color-earth-300)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-[var(--font-size-sm)] text-[var(--color-earth-500)]">
          {uploading ? 'Uploading…' : 'Click or drag images / videos here'}
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
          JPG, PNG, WebP, MP4 · Max 50MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files);
        }}
      />

      {error && (
        <div
          role="alert"
          className="mt-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] bg-[var(--color-error-light)]"
        >
          <p className="text-[var(--font-size-xs)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {media.length > 0 && (
        <div className="mt-[var(--spacing-5)] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[var(--spacing-3)]">
          {media.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              className="relative group rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-earth-50)] border border-[var(--color-earth-100)] aspect-square cursor-grab active:cursor-grabbing"
            >
              {item.media_type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--color-earth-400)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt_text ?? `Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
              )}
              <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label={`Delete image ${index + 1}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--color-error)] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {media.length > 1 && (
        <p className="mt-[var(--spacing-2)] text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
          Drag to reorder. First image is the product thumbnail.
        </p>
      )}
    </div>
  );
}
