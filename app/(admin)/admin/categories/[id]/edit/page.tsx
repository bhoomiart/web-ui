export const instant = false;

import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { CategoryForm } from '../../CategoryForm';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: category, error } = await admin
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !category) notFound();

  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${category.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Categories', href: '/admin/categories' },
          { label: category.name },
        ]}
      />
      <CategoryForm category={category} />
    </div>
  );
}
