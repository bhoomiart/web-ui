export const instant = false;
/**
 * /admin/settings/refund-policy — return window and refund timelines (A6-T6-1, A6-T6-2)
 */
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { getPolicySettings } from '@/lib/policy-settings';
import { RefundPolicyForm } from './RefundPolicyForm';

export default async function RefundPolicySettingsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Return & Refund Policy"
        description="Set the return window and refund timeline. These values are enforced on return requests and shown on the public Returns & Refunds page."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Return & Refund Policy' },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading policy..." />
          </div>
        }
      >
        <PolicyContent />
      </Suspense>
    </div>
  );
}

async function PolicyContent() {
  await requireAdmin();
  const settings = await getPolicySettings();
  return <RefundPolicyForm initial={settings} />;
}
