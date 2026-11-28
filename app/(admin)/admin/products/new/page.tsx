export const instant = false;

/**
 * /admin/products/new — Create a new product.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductForm } from '../ProductForm';

export default async function NewProductPage() {
  await requireStaff();

  const admin = createAdminClient();
  const { data: categories } = await admin
    .from('categories')
    .select('id, name')
    .order('display_order', { ascending: true });

  return (
    <div>
      <AdminPageHeader
        title="Add Product"
        description="Create a new product in the catalogue."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Products', href: '/admin/products' },
          { label: 'Add Product' },
        ]}
      />
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
