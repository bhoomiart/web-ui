export const instant = false;

import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { CollectionForm } from '../../CollectionForm';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: collection } = await admin
    .from('collections')
    .select('id, name, slug, type, description, is_visible')
    .eq('id', id)
    .maybeSingle();

  if (!collection) notFound();

  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${collection.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Collections', href: '/admin/collections' },
          { label: collection.name },
        ]}
      />
      <CollectionForm collection={collection} />
    </div>
  );
}
