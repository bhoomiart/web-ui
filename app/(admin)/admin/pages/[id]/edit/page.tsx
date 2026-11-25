export const instant = false;

import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageEditor } from '../../PageEditor';

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: page, error } = await admin.from('pages').select('*').eq('id', id).single();
  if (error || !page) notFound();

  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${page.title}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Pages', href: '/admin/pages' },
          { label: page.title },
        ]}
      />
      <PageEditor page={page} />
    </div>
  );
}
