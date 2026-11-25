export const instant = false;

import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { CategoryForm } from '../CategoryForm';

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Add Category"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'Add Category' },
        ]}
      />
      <CategoryForm />
    </div>
  );
}
