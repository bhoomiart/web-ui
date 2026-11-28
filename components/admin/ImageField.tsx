'use client';
/**
 * ImageField: upload, replace or remove a single image for a catalogue record.
 * Uploads to /api/admin/upload-image and reports the public URL to the parent form.
 */
import * as React from 'react';

export function ImageField({
  label,
  folder,
  value,
  onChange,
}: {
  label: string;
  folder: 'categories' | 'subcategories';
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', folder);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Upload failed.');
        return;
      }
      onChange(json.url);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="md:col-span-2">
      <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-1-5)]">
        {label}
      </p>
      <div className="flex items-center gap-[var(--spacing-4)]">
        <div className="w-24 h-24 rounded-[var(--radius-md)] border border-[var(--color-earth-200)] bg-[var(--color-earth-50)] overflow-hidden flex items-center justify-center text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            'No image'
          )}
        </div>
        <div className="flex flex-col gap-[var(--spacing-2)] items-start">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={label}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void upload(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] hover:bg-[var(--color-earth-50)] disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[var(--font-size-xs)] text-[var(--color-error)] hover:underline"
            >
              Remove image
            </button>
          )}
          <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)]">
            JPG, PNG or WebP, up to 10 MB. Save the form to apply changes.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[var(--font-size-xs)] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
