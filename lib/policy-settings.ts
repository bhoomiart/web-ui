/**
 * Return/refund policy settings stored in site_settings (A6-T6).
 */
import { createAdminClient } from '@/lib/supabase/admin';

export const POLICY_KEYS = {
  returnWindowDays: 'return_window_days',
  refundProcessingDays: 'refund_processing_days',
  returnPolicyNote: 'return_policy_note',
} as const;

export interface PolicySettings {
  returnWindowDays: number;
  refundProcessingDays: number;
  returnPolicyNote: string;
}

export const POLICY_DEFAULTS: PolicySettings = {
  returnWindowDays: 7,
  refundProcessingDays: 7,
  returnPolicyNote: '',
};

function toDays(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 && n <= 365 ? n : fallback;
}

export async function getPolicySettings(): Promise<PolicySettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', Object.values(POLICY_KEYS));
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value as string]));
  return {
    returnWindowDays: toDays(map[POLICY_KEYS.returnWindowDays], POLICY_DEFAULTS.returnWindowDays),
    refundProcessingDays: toDays(
      map[POLICY_KEYS.refundProcessingDays],
      POLICY_DEFAULTS.refundProcessingDays
    ),
    returnPolicyNote: map[POLICY_KEYS.returnPolicyNote] ?? '',
  };
}
