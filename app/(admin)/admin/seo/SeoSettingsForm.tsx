'use client';

import * as React from 'react';
import { FormField, Input } from '@/components/ui/Form';

interface SeoSettingsFormProps {
  settings: Record<string, string>;
}

export function SeoSettingsForm({ settings }: SeoSettingsFormProps) {
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const updates = [
      { key: 'site_name', value: fd.get('site_name') as string },
      { key: 'site_tagline', value: fd.get('site_tagline') as string },
      { key: 'ga4_id', value: fd.get('ga4_id') as string },
      { key: 'gtm_id', value: fd.get('gtm_id') as string },
      { key: 'gsc_verification', value: fd.get('gsc_verification') as string },
    ];

    const res = await fetch('/api/admin/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const json = (await res.json()) as { error?: string };
    setPending(false);
    if (json.error) {
      setError(json.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--spacing-5)]">
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-6)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-5)]">
        <FormField label="Site Name" htmlFor="seo_site_name" hint="Appended to page titles">
          <Input
            id="seo_site_name"
            name="site_name"
            defaultValue={settings.site_name ?? 'Bhoomi Art'}
          />
        </FormField>

        <FormField label="Tagline" htmlFor="seo_tagline">
          <Input
            id="seo_tagline"
            name="site_tagline"
            defaultValue={settings.site_tagline ?? 'Beauty of Mother Earth'}
          />
        </FormField>

        <FormField label="Google Analytics 4 ID" htmlFor="seo_ga4" hint="Format: G-XXXXXXXXXX">
          <Input
            id="seo_ga4"
            name="ga4_id"
            defaultValue={settings.ga4_id ?? ''}
            placeholder="G-XXXXXXXXXX"
          />
        </FormField>

        <FormField label="Google Tag Manager ID" htmlFor="seo_gtm" hint="Format: GTM-XXXXXXX">
          <Input
            id="seo_gtm"
            name="gtm_id"
            defaultValue={settings.gtm_id ?? ''}
            placeholder="GTM-XXXXXXX"
          />
        </FormField>

        <FormField
          label="Google Search Console Verification"
          htmlFor="seo_gsc"
          hint="Content value from the verification meta tag"
          className="md:col-span-2"
        >
          <Input
            id="seo_gsc"
            name="gsc_verification"
            defaultValue={settings.gsc_verification ?? ''}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </FormField>
      </div>

      {error && (
        <div
          role="alert"
          className="px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)]"
        >
          <p className="text-[var(--font-size-sm)] text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {saved && (
        <div className="px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-success-light)]">
          <p className="text-[var(--font-size-sm)] text-[var(--color-success)]">
            Settings saved successfully.
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="px-[var(--spacing-6)] py-[var(--spacing-2-5)] rounded-[var(--radius-button)] bg-[var(--color-brand-primary)] text-white text-[var(--font-size-sm)] font-semibold shadow-[var(--shadow-button)] hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {pending ? 'Saving…' : 'Save SEO Settings'}
        </button>
      </div>
    </form>
  );
}
