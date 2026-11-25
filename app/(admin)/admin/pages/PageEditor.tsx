'use client';

/**
 * PageEditor — calls POST /api/admin/pages (create or update).
 * No Server Action imports.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FormField, Input, Textarea, Checkbox } from '@/components/ui/Form';

type PageData = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  is_published: boolean;
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

export function PageEditor({ page }: { page?: PageData }) {
  const router = useRouter();
  const isEdit = !!page;
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState(page?.slug ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      id: page?.id ?? undefined,
      slug: fd.get('slug'),
      title: fd.get('title'),
      body: fd.get('body') || null,
      is_published: fd.has('is_published'),
      seo_title: fd.get('seo_title') || null,
      seo_description: fd.get('seo_description') || null,
    };

    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    setPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? 'Something went wrong.');
      return;
    }
    router.push('/admin/pages');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--spacing-5)]">
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
        <FormField label="Title" required htmlFor="page_title">
          <Input
            id="page_title"
            name="title"
            required
            defaultValue={page?.title}
            placeholder="Our Story"
            onChange={(e) => !isEdit && setSlug(slugify(e.target.value))}
          />
        </FormField>

        <FormField label="Slug" required htmlFor="page_slug" hint="Used in the URL: /[slug]">
          <Input
            id="page_slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="about"
          />
        </FormField>

        <FormField label="Content" htmlFor="page_body" className="md:col-span-2">
          <Textarea
            id="page_body"
            name="body"
            rows={16}
            defaultValue={page?.body ?? ''}
            placeholder="# Our Story&#10;&#10;Bhoomi Art was founded…"
          />
        </FormField>

        <FormField label="SEO Title" htmlFor="page_seo_title">
          <Input
            id="page_seo_title"
            name="seo_title"
            defaultValue={page?.seo_title ?? ''}
            placeholder="Our Story | Bhoomi Art"
          />
        </FormField>

        <FormField label="SEO Description" htmlFor="page_seo_desc">
          <Input
            id="page_seo_desc"
            name="seo_description"
            defaultValue={page?.seo_description ?? ''}
          />
        </FormField>

        <div className="flex items-center">
          <Checkbox
            name="is_published"
            label="Published (visible to visitors)"
            defaultChecked={page?.is_published ?? false}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      <div className="flex gap-[var(--spacing-3)]">
        <button
          type="submit"
          disabled={pending}
          className="px-[var(--spacing-6)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Page'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/pages')}
          className="px-[var(--spacing-5)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] border border-[var(--color-earth-200)] text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] hover:bg-[var(--color-earth-50)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
