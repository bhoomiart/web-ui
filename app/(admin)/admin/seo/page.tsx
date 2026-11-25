export const instant = false;

/**
 * /admin/seo — Global SEO settings.
 * Shows a form to update key site_settings entries.
 */

import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { Spinner } from '@/components/ui/Spinner';
import { SeoSettingsForm } from './SeoSettingsForm';

export default async function SeoPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="SEO Management"
        description="Global SEO settings, verification tags, and analytics IDs."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'SEO' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading…" />
          </div>
        }
      >
        <SeoContent />
      </Suspense>
    </div>
  );
}

async function SeoContent() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'site_tagline', 'ga4_id', 'gtm_id', 'gsc_verification']);

  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return <SeoSettingsForm settings={settings} />;
}
