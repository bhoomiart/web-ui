export const instant = false;
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { SubcategoryForm } from '../../SubcategoryForm';

export default async function EditSubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const [subRes, catRes] = await Promise.all([
    admin.from('subcategories').select('*').eq('id', id).single(),
    admin.from('categories').select('id, name').order('display_order'),
  ]);
  if (subRes.error || !subRes.data) notFound();
  const subcategory = subRes.data;

  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${subcategory.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Subcategories', href: '/admin/categories/subcategories' },
          { label: subcategory.name },
        ]}
      />
      <SubcategoryForm subcategory={subcategory} categories={catRes.data ?? []} />
    </div>
  );
}
