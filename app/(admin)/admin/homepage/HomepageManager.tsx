'use client';

/**
 * HomepageManager — toggle section visibility, manage banners.
 * Calls PATCH /api/admin/homepage/sections/[id]/visibility
 *       POST   /api/admin/homepage/banners
 *       DELETE /api/admin/homepage/banners/[id]
 * No Server Action imports.
 */

import * as React from 'react';
import { FormField, Input, Checkbox } from '@/components/ui/Form';

type Section = {
  id: string;
  section_key: string;
  title: string | null;
  is_visible: boolean;
  display_order: number;
};
type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  is_active: boolean;
  display_order: number;
};

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  brand_intro: 'Brand Introduction',
  featured_categories: 'Featured Categories',
  featured_products: 'Featured Products',
  signature: 'Signature Collection',
  bestsellers: 'Best Sellers',
  new_arrivals: 'New Arrivals',
  customized: 'Custom Creations',
  craftsmanship: 'Craftsmanship Story',
  testimonials: 'Customer Testimonials',
  whatsapp_cta: 'WhatsApp Enquiry',
};

export function HomepageManager({
  sections,
  banners: initialBanners,
}: {
  sections: Section[];
  banners: Banner[];
}) {
  const [sectionState, setSectionState] = React.useState(sections);
  const [banners, setBanners] = React.useState(initialBanners);
  const [showBannerForm, setShowBannerForm] = React.useState(false);
  const [bannerPending, setBannerPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleToggle(sectionId: string, currentlyVisible: boolean) {
    // Optimistic update
    setSectionState((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, is_visible: !currentlyVisible } : s))
    );

    const res = await fetch(`/api/admin/homepage/sections/${sectionId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !currentlyVisible }),
    });

    if (!res.ok) {
      setSectionState((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, is_visible: currentlyVisible } : s))
      );
      setError('Failed to update section visibility.');
    }
  }

  async function handleDeleteBanner(bannerId: string) {
    const res = await fetch(`/api/admin/homepage/banners/${bannerId}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Failed to delete banner.');
      return;
    }
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
  }

  async function handleAddBanner(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBannerPending(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      image_url: fd.get('image_url'),
      title: fd.get('title') || null,
      subtitle: fd.get('subtitle') || null,
      cta_text: fd.get('cta_text') || null,
      cta_url: fd.get('cta_url') || null,
      is_active: fd.has('is_active'),
      display_order: Number(fd.get('display_order') ?? banners.length),
    };

    const res = await fetch('/api/admin/homepage/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { banner?: { id: string }; error?: string };
    setBannerPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? 'Failed to add banner.');
      return;
    }
    setShowBannerForm(false);
    // Reload to show new banner with fresh data from server
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-[var(--spacing-8)]">
      {error && (
        <div
          role="alert"
          className="px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {/* Sections */}
      <section>
        <h2 className="heading-5 mb-[var(--spacing-4)]">Page Sections</h2>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-earth-100)]">
          {sectionState.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between px-[var(--spacing-5)] py-[var(--spacing-3-5)]"
            >
              <div>
                <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)]">
                  {SECTION_LABELS[section.section_key] ?? section.title ?? section.section_key}
                </p>
                <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] font-mono">
                  {section.section_key}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={section.is_visible}
                onClick={() => handleToggle(section.id, section.is_visible)}
                className={[
                  'relative inline-flex h-6 w-11 items-center rounded-full',
                  'transition-colors duration-[var(--duration-normal)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2',
                  section.is_visible
                    ? 'bg-[var(--color-brand-primary)]'
                    : 'bg-[var(--color-earth-200)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-[var(--duration-normal)]',
                    section.is_visible ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Banners */}
      <section>
        <div className="flex items-center justify-between mb-[var(--spacing-4)]">
          <h2 className="heading-5">Banners</h2>
          <button
            type="button"
            onClick={() => setShowBannerForm((v) => !v)}
            className="inline-flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold hover:opacity-90 transition-opacity"
          >
            {showBannerForm ? 'Cancel' : '+ Add Banner'}
          </button>
        </div>

        {showBannerForm && (
          <form
            onSubmit={handleAddBanner}
            className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-5)] mb-[var(--spacing-4)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-4)]"
          >
            <FormField
              label="Image URL"
              required
              htmlFor="banner_image_url"
              className="md:col-span-2"
            >
              <Input id="banner_image_url" name="image_url" required placeholder="https://…" />
            </FormField>
            <FormField label="Title" htmlFor="banner_title">
              <Input id="banner_title" name="title" placeholder="New Collection" />
            </FormField>
            <FormField label="Subtitle" htmlFor="banner_subtitle">
              <Input id="banner_subtitle" name="subtitle" placeholder="Handcrafted with love" />
            </FormField>
            <FormField label="CTA Text" htmlFor="banner_cta_text">
              <Input id="banner_cta_text" name="cta_text" placeholder="Shop Now" />
            </FormField>
            <FormField label="CTA URL" htmlFor="banner_cta_url">
              <Input id="banner_cta_url" name="cta_url" placeholder="/shop" />
            </FormField>
            <div className="flex items-center gap-[var(--spacing-4)]">
              <Checkbox name="is_active" label="Active" defaultChecked />
              <div>
                <label
                  htmlFor="banner_order"
                  className="text-[var(--font-size-sm)] font-medium text-[var(--color-earth-700)]"
                >
                  Order
                </label>
                <input
                  id="banner_order"
                  name="display_order"
                  type="number"
                  min="0"
                  defaultValue={banners.length}
                  className="ml-2 w-16 rounded-[var(--radius-sm)] border border-[var(--color-earth-200)] px-2 py-1 text-[var(--font-size-sm)]"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={bannerPending}
                className="px-[var(--spacing-5)] py-[var(--spacing-2)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {bannerPending ? 'Saving…' : 'Add Banner'}
              </button>
            </div>
          </form>
        )}

        {banners.length === 0 ? (
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] flex items-center justify-center py-12">
            <p className="text-[var(--font-size-sm)] text-[var(--color-earth-400)]">
              No banners yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-earth-100)]">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex items-center gap-[var(--spacing-4)] px-[var(--spacing-5)] py-[var(--spacing-3-5)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title ?? 'Banner'}
                  className="w-16 h-10 object-cover rounded-[var(--radius-sm)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-900)] truncate">
                    {banner.title ?? '(no title)'}
                  </p>
                  <p className="text-[var(--font-size-xs)] text-[var(--color-earth-400)] truncate">
                    {banner.cta_url ?? ''}
                  </p>
                </div>
                <span
                  className="inline-flex items-center px-[var(--spacing-2)] py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-semibold shrink-0"
                  style={{
                    color: banner.is_active ? 'var(--color-success)' : 'var(--color-earth-500)',
                    background: banner.is_active
                      ? 'var(--color-success-light)'
                      : 'var(--color-earth-100)',
                  }}
                >
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteBanner(banner.id)}
                  aria-label={`Delete banner ${banner.title ?? ''}`}
                  className="shrink-0 text-[var(--color-error)] hover:text-[var(--color-error-dark)] text-[var(--font-size-xs)] font-semibold hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
