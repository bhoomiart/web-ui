export const instant = false;

/**
 * /admin/homepage — Manage homepage sections and banners.
 */

import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { createAdminClient } from '@/lib/supabase/admin';
import { HomepageManager } from './HomepageManager';

export default async function HomepagePage() {
  await requireStaff();
  return (
    <div>
      <AdminPageHeader
        title="Homepage Management"
        description="Control which sections are visible and in what order."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Homepage' }]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading…" />
          </div>
        }
      >
        <HomepageContent />
      </Suspense>
    </div>
  );
}

async function HomepageContent() {
  const admin = createAdminClient();
  const [sectionsRes, bannersRes] = await Promise.all([
    admin.from('homepage_sections').select('*').order('display_order'),
    admin.from('banners').select('*').order('display_order'),
  ]);

  return <HomepageManager sections={sectionsRes.data ?? []} banners={bannersRes.data ?? []} />;
}
