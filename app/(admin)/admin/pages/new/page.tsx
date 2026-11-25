export const instant = false;

import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { PageEditor } from '../PageEditor';

export default async function NewPagePage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Add Page"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Pages', href: '/admin/pages' },
          { label: 'Add Page' },
        ]}
      />
      <PageEditor />
    </div>
  );
}
