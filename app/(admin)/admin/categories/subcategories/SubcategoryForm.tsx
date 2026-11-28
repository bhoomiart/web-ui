'use client';

/**
 * SubcategoryForm — calls POST /api/admin/subcategories (create)
 *                   or PATCH /api/admin/subcategories/[id] (edit).
 * No Server Action imports.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ImageField } from '@/components/admin/ImageField';
import { FormField, Input, Textarea, Select, Checkbox } from '@/components/ui/Form';

type Category = { id: string; name: string };
type SubcatData = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  image_url?: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function SubcategoryForm({
  subcategory,
  categories,
}: {
  subcategory?: SubcatData;
  categories: Category[];
}) {
  const router = useRouter();
  const isEdit = !!subcategory;
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(subcategory?.image_url ?? null);
  const [slug, setSlug] = React.useState(subcategory?.slug ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      slug: fd.get('slug'),
      category_id: fd.get('category_id'),
      description: fd.get('description') || null,
      is_visible: fd.has('is_visible'),
      display_order: Number(fd.get('display_order') ?? 0),
      image_url: imageUrl,
    };

    const url = isEdit ? `/api/admin/subcategories/${subcategory.id}` : '/api/admin/subcategories';
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
    router.push('/admin/categories/subcategories');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
        <FormField label="Parent Category" required htmlFor="category_id">
          <Select
            id="category_id"
            name="category_id"
            required
            defaultValue={subcategory?.category_id}
            placeholder="Select category…"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Name" required htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={subcategory?.name}
            placeholder="Wall Hangings"
            onChange={(e) => !isEdit && setSlug(slugify(e.target.value))}
          />
        </FormField>

        <FormField label="Slug" required htmlFor="slug">
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="wall-hangings"
          />
        </FormField>

        <FormField label="Display Order" htmlFor="display_order">
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min="0"
            defaultValue={subcategory?.display_order ?? 0}
          />
        </FormField>

        <FormField label="Description" htmlFor="description" className="md:col-span-2">
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={subcategory?.description ?? ''}
          />
        </FormField>

        <ImageField
          label="Subcategory image"
          folder="subcategories"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="flex items-center">
          <Checkbox
            name="is_visible"
            label="Visible on storefront"
            defaultChecked={subcategory?.is_visible ?? true}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-[var(--spacing-4)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)]"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      <div className="mt-[var(--spacing-5)] flex gap-[var(--spacing-3)]">
        <button
          type="submit"
          disabled={pending}
          className="px-[var(--spacing-6)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Subcategory'}
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
