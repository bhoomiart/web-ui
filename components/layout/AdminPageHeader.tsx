/**
 * AdminPageHeader — reusable header for every admin page.
 *
 * Server component — no interactivity needed.
 *
 * Usage:
 *   <AdminPageHeader
 *     title="Products"
 *     description="Manage your product catalogue."
 *     action={<Button href="/admin/products/new">Add Product</Button>}
 *     breadcrumbs={[
 *       { label: 'Dashboard', href: '/admin/dashboard' },
 *       { label: 'Products' },
 *     ]}
 *   />
 */

import { BreadcrumbNav, type BreadcrumbItem } from './BreadcrumbNav';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Optional element rendered in the top-right — usually a primary action button */
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function AdminPageHeader({ title, description, action, breadcrumbs }: AdminPageHeaderProps) {
  return (
    <div className="mb-[var(--spacing-8)]">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 1 && (
        <div className="mb-[var(--spacing-3)]">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-[var(--spacing-4)]">
        <div className="min-w-0">
          <h1 className="heading-4 truncate">{title}</h1>
          {description && (
            <p className="mt-[var(--spacing-1)] body-small text-[var(--color-earth-500)]">
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Divider */}
      <div aria-hidden="true" className="mt-[var(--spacing-5)] h-px bg-[var(--color-earth-100)]" />
    </div>
  );
}
