/**
 * PATCH /api/admin/settings
 *
 * Upsert one or more site_settings keys.
 * Body: { [key: string]: string }
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Record<string, unknown>;

  const entries = Object.entries(body).filter(([, v]) => typeof v === 'string') as [
    string,
    string,
  ][];

  if (entries.length === 0) {
    return NextResponse.json({ error: 'No valid key-value pairs provided.' }, { status: 400 });
  }

  const admin = createAdminClient();

  for (const [key, value] of entries) {
    const { error } = await admin
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json(
        { error: `Failed to update "${key}": ${error.message}` },
        { status: 500 }
      );
    }
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'settings.update',
    table_name: 'site_settings',
    diff: Object.fromEntries(entries) as never,
  });

  return NextResponse.json({ success: true, updated: entries.map(([k]) => k) });
}
