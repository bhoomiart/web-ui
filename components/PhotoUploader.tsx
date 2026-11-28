'use client';
/**
 * PhotoUploader: pick up to `max` photos, upload each to /api/uploads, and report the
 * stored paths to the parent. Previews use local object URLs.
 */
import React from 'react';

type Entry = {
  key: string;
  preview: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  path?: string;
  error?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoUploader({
  kind,
  max = 5,
  label,
  hint,
  onChange,
  onBusyChange,
}: {
  kind: 'customization' | 'return' | 'review';
  max?: number;
  label: string;
  hint?: string;
  /** Called with the paths of all successfully uploaded photos. */
  onChange: (paths: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const idRef = React.useRef(0);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    onChange(entries.flatMap((e) => (e.status === 'done' && e.path ? [e.path] : [])));
    onBusyChange?.(entries.some((e) => e.status === 'uploading'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // Release preview URLs on unmount
  const entriesRef = React.useRef(entries);
  React.useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  React.useEffect(
    () => () => entriesRef.current.forEach((e) => URL.revokeObjectURL(e.preview)),
    []
  );

  function patch(key: string, change: Partial<Entry>) {
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...change } : e)));
  }

  async function upload(key: string, file: File) {
    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.path !== 'string') {
        patch(key, { status: 'error', error: data.error ?? 'Upload failed.' });
        return;
      }
      patch(key, { status: 'done', path: data.path });
    } catch {
      patch(key, { status: 'error', error: 'Network error.' });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setMessage(null);
    const room = max - entries.length;
    if (files.length > room) setMessage(`You can add up to ${max} photos.`);

    const added: Entry[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setMessage('Only JPG, PNG or WebP photos are allowed.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setMessage('Each photo must be 5 MB or smaller.');
        continue;
      }
      const key = `p${idRef.current++}`;
      added.push({
        key,
        preview: URL.createObjectURL(file),
        name: file.name,
        status: 'uploading',
      });
      void upload(key, file);
    }
    if (added.length) setEntries((list) => [...list, ...added]);
  }

  function remove(key: string) {
    setEntries((list) => {
      const gone = list.find((e) => e.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return list.filter((e) => e.key !== key);
    });
  }

  return (
    <div>
      <p className="block text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-1">
        {label}
      </p>
      {hint && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-earth-500)] mb-2">{hint}</p>
      )}
      <ul className="flex flex-wrap gap-[var(--spacing-2)] mb-2">
        {entries.map((e) => (
          <li
            key={e.key}
            className="relative w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-earth-200)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.preview} alt={e.name} className="w-full h-full object-cover" />
            {e.status === 'uploading' && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[var(--font-size-xs)]">
                Uploading…
              </span>
            )}
            {e.status === 'error' && (
              <span
                role="alert"
                title={e.error}
                className="absolute inset-0 flex items-center justify-center bg-white/80 text-[var(--font-size-xs)] text-[var(--color-error)] text-center p-1"
              >
                {e.error}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(e.key)}
              aria-label={`Remove ${e.name}`}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {entries.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onPick}
            className="sr-only"
            aria-label={label}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-[var(--spacing-4)] h-9 rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--color-earth-700)] text-[var(--font-size-sm)] font-semibold hover:bg-[var(--color-earth-50)]"
          >
            Add photos
          </button>
        </>
      )}
      {message && (
        <p role="alert" className="text-[var(--font-size-xs)] text-[var(--color-error)] mt-1">
          {message}
        </p>
      )}
    </div>
  );
}
