export const instant = false;

import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { CollectionForm } from '../CollectionForm';

export default async function NewCollectionPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Add Collection"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Collections', href: '/admin/collections' },
          { label: 'New' },
        ]}
      />
      <CollectionForm />
    </div>
  );
}
