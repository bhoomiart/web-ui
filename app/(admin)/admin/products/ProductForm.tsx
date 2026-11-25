'use client';

/**
 * ProductForm — create/edit form for products.
 * Calls POST /api/admin/products (create) or PATCH /api/admin/products/[id] (edit).
 * No Server Action imports.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FormField, Input, Textarea, Select, Checkbox } from '@/components/ui/Form';

type Category = { id: string; name: string };

type ProductData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  long_description: string | null;
  materials: string | null;
  care_instructions: string | null;
  story_content: string | null;
  price: number | null;
  sku: string | null;
  availability_type: string;
  preparation_time: string | null;
  status: string;
  is_featured: boolean;
  is_signature: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_slug: string | null;
  og_image_url: string | null;
};

interface ProductFormProps {
  product?: ProductData;
  categories: Category[];
}

const TABS = ['Basic Info', 'Description', 'Flags & Collections', 'SEO'] as const;
type Tab = (typeof TABS)[number];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Collect form fields into a plain object for JSON POST */
function collectFields(form: HTMLFormElement, booleanFields: string[]): Record<string, unknown> {
  const fd = new FormData(form);
  const result: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    result[key] = value;
  }
  // Checkboxes are only present when checked; set false for unchecked
  for (const field of booleanFields) {
    result[field] = fd.has(field);
  }
  return result;
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [activeTab, setActiveTab] = React.useState<Tab>('Basic Info');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState(product?.slug ?? '');
  const [autoSlug, setAutoSlug] = React.useState(!isEdit);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const booleans = ['is_featured', 'is_signature', 'is_bestseller', 'is_new_arrival'];
    const body = collectFields(e.currentTarget, booleans);

    const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string; product?: { id: string } };

    setPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? 'Something went wrong. Please try again.');
      return;
    }

    if (!isEdit && json.product?.id) {
      router.push(`/admin/products/${json.product.id}/edit`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--spacing-6)]">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[var(--color-earth-100)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'px-[var(--spacing-4)] py-[var(--spacing-2-5)] text-[var(--font-size-sm)] font-semibold border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'border-transparent text-[var(--color-earth-500)] hover:text-[var(--color-earth-800)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Basic Info ────────────────────────────────────────────── */}
      <div className={activeTab === 'Basic Info' ? 'block' : 'hidden'}>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
          <FormField label="Product Name" required htmlFor="name" className="md:col-span-2">
            <Input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
              placeholder="Handcrafted Clay Pot"
              onChange={(e) => {
                if (autoSlug) setSlug(slugify(e.target.value));
              }}
            />
          </FormField>

          <FormField
            label="Slug"
            required
            htmlFor="slug"
            hint="Used in product URL: /product/[slug]"
          >
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="handcrafted-clay-pot"
            />
          </FormField>

          <FormField label="SKU" htmlFor="sku">
            <Input id="sku" name="sku" defaultValue={product?.sku ?? ''} placeholder="BA-POT-001" />
          </FormField>

          <FormField label="Price (₹)" htmlFor="price" hint="Leave blank if price on request">
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price ?? ''}
              placeholder="599.00"
            />
          </FormField>

          <FormField label="Availability" required htmlFor="availability_type">
            <Select
              id="availability_type"
              name="availability_type"
              defaultValue={product?.availability_type ?? 'ready_to_ship'}
            >
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="made_to_order">Made to Order</option>
              <option value="out_of_stock">Out of Stock</option>
            </Select>
          </FormField>

          <FormField
            label="Preparation Time"
            htmlFor="preparation_time"
            hint="For Made to Order — e.g. '7–10 business days'"
          >
            <Input
              id="preparation_time"
              name="preparation_time"
              defaultValue={product?.preparation_time ?? ''}
              placeholder="7–10 business days"
            />
          </FormField>

          <FormField label="Status" required htmlFor="status">
            <Select id="status" name="status" defaultValue={product?.status ?? 'draft'}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </FormField>

          <FormField label="Materials" htmlFor="materials" className="md:col-span-2">
            <Input
              id="materials"
              name="materials"
              defaultValue={product?.materials ?? ''}
              placeholder="Natural terracotta clay, hand-painted with mineral pigments"
            />
          </FormField>

          <FormField
            label="Short Description"
            htmlFor="short_description"
            className="md:col-span-2"
            hint="Shown on product cards (1–2 sentences)"
          >
            <Textarea
              id="short_description"
              name="short_description"
              rows={3}
              defaultValue={product?.short_description ?? ''}
              placeholder="A beautifully handcrafted terracotta pot…"
            />
          </FormField>
        </div>
      </div>

      {/* ── Description ───────────────────────────────────────────── */}
      <div className={activeTab === 'Description' ? 'block' : 'hidden'}>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] flex flex-col gap-[var(--spacing-5)]">
          <FormField label="Full Description" htmlFor="long_description">
            <Textarea
              id="long_description"
              name="long_description"
              rows={8}
              defaultValue={product?.long_description ?? ''}
              placeholder="This exquisite piece is handcrafted by our artisans…"
            />
          </FormField>
          <FormField label="Craftsmanship / Story" htmlFor="story_content">
            <Textarea
              id="story_content"
              name="story_content"
              rows={6}
              defaultValue={product?.story_content ?? ''}
              placeholder="Every stroke tells a story…"
            />
          </FormField>
          <FormField label="Care Instructions" htmlFor="care_instructions">
            <Textarea
              id="care_instructions"
              name="care_instructions"
              rows={4}
              defaultValue={product?.care_instructions ?? ''}
              placeholder="Wipe clean with a damp cloth."
            />
          </FormField>
        </div>
      </div>

      {/* ── Flags & Collections ───────────────────────────────────── */}
      <div className={activeTab === 'Flags & Collections' ? 'block' : 'hidden'}>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] flex flex-col gap-[var(--spacing-6)]">
          <div>
            <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-3)]">
              Product Labels
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-3)]">
              <Checkbox name="is_featured" label="Featured" defaultChecked={product?.is_featured} />
              <Checkbox
                name="is_signature"
                label="Signature"
                defaultChecked={product?.is_signature}
              />
              <Checkbox
                name="is_bestseller"
                label="Best Seller"
                defaultChecked={product?.is_bestseller}
              />
              <Checkbox
                name="is_new_arrival"
                label="New Arrival"
                defaultChecked={product?.is_new_arrival}
              />
            </div>
          </div>
          {categories.length > 0 && (
            <FormField label="Category" htmlFor="category_id">
              <Select id="category_id" name="category_id" placeholder="Select category…">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </div>
      </div>

      {/* ── SEO ────────────────────────────���──────────────────────── */}
      <div className={activeTab === 'SEO' ? 'block' : 'hidden'}>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] flex flex-col gap-[var(--spacing-5)]">
          <FormField label="SEO Title" htmlFor="seo_title">
            <Input
              id="seo_title"
              name="seo_title"
              defaultValue={product?.seo_title ?? ''}
              placeholder="Handcrafted Clay Pot | Bhoomi Art"
            />
          </FormField>
          <FormField label="Meta Description" htmlFor="seo_description">
            <Textarea
              id="seo_description"
              name="seo_description"
              rows={3}
              defaultValue={product?.seo_description ?? ''}
            />
          </FormField>
          <FormField label="SEO Slug" htmlFor="seo_slug" hint="Leave blank to use the product slug">
            <Input id="seo_slug" name="seo_slug" defaultValue={product?.seo_slug ?? ''} />
          </FormField>
          <FormField label="OG Image URL" htmlFor="og_image_url">
            <Input
              id="og_image_url"
              name="og_image_url"
              defaultValue={product?.og_image_url ?? ''}
              placeholder="https://…"
            />
          </FormField>
        </div>
      </div>

      {/* Error + Submit */}
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
          className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-6)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 disabled:opacity-60 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
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
