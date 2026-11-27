'use client';

/**
 * CollectionForm — POST /api/admin/collections (create)
 *                  or PATCH /api/admin/collections/[id] (edit).
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FormField, Input, Textarea, Select, Checkbox } from '@/components/ui/Form';

const TYPES = [
  'signature',
  'bestsellers',
  'new_arrivals',
  'featured',
  'trending',
  'customized',
  'special',
] as const;

type CollectionData = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  is_visible: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CollectionForm({ collection }: { collection?: CollectionData }) {
  const router = useRouter();
  const isEdit = !!collection;
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState(collection?.slug ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      slug: fd.get('slug'),
      type: fd.get('type'),
      description: fd.get('description') || null,
      is_visible: fd.has('is_visible'),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/collections/${collection.id}` : '/api/admin/collections',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? 'Something went wrong.');
        return;
      }
      router.push('/admin/collections');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
        <FormField label="Name" required htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={collection?.name}
            placeholder="Festive Edit"
            onChange={(e) => !isEdit && setSlug(slugify(e.target.value))}
          />
        </FormField>

        <FormField label="Slug" required htmlFor="slug" hint="Used in URLs">
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </FormField>

        <FormField label="Type" required htmlFor="type">
          <Select id="type" name="type" defaultValue={collection?.type ?? 'special'}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex flex-col justify-end">
          <Checkbox
            name="is_visible"
            label="Visible on storefront"
            defaultChecked={collection?.is_visible ?? true}
          />
        </div>

        <FormField label="Description" htmlFor="description" className="md:col-span-2">
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={collection?.description ?? ''}
          />
        </FormField>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-[var(--spacing-4)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      <div className="mt-[var(--spacing-5)] flex gap-[var(--spacing-3)]">
        <button
          type="submit"
          disabled={pending}
          className="px-[var(--spacing-6)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Collection'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-[var(--spacing-5)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
