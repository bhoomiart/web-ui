export const instant = false;

/**
 * /admin/products/[id]/edit — Edit an existing product.
 */

import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductForm } from '../../ProductForm';
import { MediaManager } from '../../MediaManager';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const admin = createAdminClient();
  const [productRes, categoriesRes, mediaRes] = await Promise.all([
    admin.from('products').select('*').eq('id', id).single(),
    admin.from('categories').select('id, name').order('display_order', { ascending: true }),
    admin
      .from('product_media')
      .select('*')
      .eq('product_id', id)
      .order('display_order', { ascending: true }),
  ]);

  if (productRes.error || !productRes.data) notFound();

  const product = productRes.data;
  const categories = categoriesRes.data ?? [];
  const media = mediaRes.data ?? [];

  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${product.name}`}
        description="Update product details, media, and SEO settings."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Products', href: '/admin/products' },
          { label: product.name },
        ]}
      />

      <div className="flex flex-col gap-[var(--spacing-8)]">
        {/* Product fields form */}
        <ProductForm product={product} categories={categories} />

        {/* Media manager */}
        <section>
          <h2 className="heading-5 mb-[var(--spacing-4)]">Images & Media</h2>
          <MediaManager productId={product.id} media={media} />
        </section>
      </div>
    </div>
  );
}
