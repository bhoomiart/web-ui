export const instant = false;
/**
 * /admin/products/new — Add Product placeholder.
 * Full form implementation in A3-T3.
 */

import { requireStaff } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import Link from 'next/link';

export default async function NewProductPage() {
  await requireStaff();

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

      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--spacing-8)] flex flex-col items-center justify-center gap-[var(--spacing-4)] text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-[var(--color-earth-100)] flex items-center justify-center">
          <svg
            className="w-7 h-7 text-[var(--color-earth-400)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="heading-5 mb-[var(--spacing-2)]">Product form coming soon</h2>
          <p className="body-small text-[var(--color-earth-500)]">
            Full product creation form — full implementation in A3-T3.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="mt-[var(--spacing-2)] text-[var(--font-size-sm)] font-semibold text-[var(--color-brand-primary)] hover:underline"
        >
          ← Back to Products
        </Link>
      </div>
    </div>
  );
}
