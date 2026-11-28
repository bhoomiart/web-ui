export const instant = false;
/**
 * /admin/settings/shipping — per-state shipping rates (A10-T2-4)
 */
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { SHIPPING_FALLBACK_STATE } from '@/lib/cart/constants';
import { ShippingRatesForm } from './ShippingRatesForm';

export default async function ShippingSettingsPage() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Shipping Rates"
        description="Set the shipping fee for each delivery state. Orders at or above a state's free-shipping amount ship free. States without an active rate use the default rate."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Shipping Rates' },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Loading rates..." />
          </div>
        }
      >
        <RatesContent />
      </Suspense>
    </div>
  );
}

async function RatesContent() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('state, fee, free_above, is_active')
    .order('state', { ascending: true });

  if (error) {
    return (
      <p role="alert" className="text-[var(--color-error)]">
        Could not load shipping rates.
      </p>
    );
  }

  const rates = (data ?? []).map((r) => ({
    state: r.state,
    fee: r.fee,
    freeAbove: r.free_above,
    isActive: r.is_active,
  }));

  // Fallback row first, then states A-Z.
  rates.sort((a, b) =>
    a.state === SHIPPING_FALLBACK_STATE
      ? -1
      : b.state === SHIPPING_FALLBACK_STATE
        ? 1
        : a.state.localeCompare(b.state)
  );

  return <ShippingRatesForm initial={rates} />;
}
