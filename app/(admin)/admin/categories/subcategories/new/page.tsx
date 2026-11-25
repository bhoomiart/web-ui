export const instant = false;

import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { SubcategoryForm } from '../SubcategoryForm';

export default async function NewSubcategoryPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: categories } = await admin
    .from('categories')
    .select('id, name')
    .order('display_order');

  return (
    <div>
      <AdminPageHeader
        title="Add Subcategory"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Subcategories', href: '/admin/categories/subcategories' },
          { label: 'Add Subcategory' },
        ]}
      />
      <SubcategoryForm categories={categories ?? []} />
    </div>
  );
}
