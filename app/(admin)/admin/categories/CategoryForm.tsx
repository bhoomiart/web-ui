'use client';

/**
 * CategoryForm — calls POST /api/admin/categories (create)
 *                or PATCH /api/admin/categories/[id] (edit).
 * No Server Action imports.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ImageField } from '@/components/admin/ImageField';
import { FormField, Input, Textarea, Checkbox } from '@/components/ui/Form';

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  image_url?: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CategoryForm({ category }: { category?: CategoryData }) {
  const router = useRouter();
  const isEdit = !!category;
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(category?.image_url ?? null);
  const [slug, setSlug] = React.useState(category?.slug ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      slug: fd.get('slug'),
      description: fd.get('description') || null,
      is_visible: fd.has('is_visible'),
      display_order: Number(fd.get('display_order') ?? 0),
      image_url: imageUrl,
      seo_title: fd.get('seo_title') || null,
      seo_description: fd.get('seo_description') || null,
    };

    const url = isEdit ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    setPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? 'Something went wrong.');
      return;
    }
    router.push('/admin/categories');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
        <FormField label="Name" required htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={category?.name}
            placeholder="Pots & Planters"
            onChange={(e) => !isEdit && setSlug(slugify(e.target.value))}
          />
        </FormField>

        <FormField label="Slug" required htmlFor="slug" hint="Used in category URLs">
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="pots-and-planters"
          />
        </FormField>

        <FormField label="Description" htmlFor="description" className="md:col-span-2">
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category?.description ?? ''}
          />
        </FormField>

        <FormField label="Display Order" htmlFor="display_order" hint="Lower numbers appear first">
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min="0"
            defaultValue={category?.display_order ?? 0}
          />
        </FormField>

        <ImageField
          label="Category image"
          folder="categories"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="flex flex-col justify-end">
          <Checkbox
            name="is_visible"
            label="Visible on storefront"
            defaultChecked={category?.is_visible ?? true}
          />
        </div>

        <FormField label="SEO Title" htmlFor="seo_title">
          <Input
            id="seo_title"
            name="seo_title"
            defaultValue={category?.seo_title ?? ''}
            placeholder="Terracotta Pots | Bhoomi Art"
          />
        </FormField>

        <FormField label="SEO Description" htmlFor="seo_description">
          <Input
            id="seo_description"
            name="seo_description"
            defaultValue={category?.seo_description ?? ''}
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
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
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
