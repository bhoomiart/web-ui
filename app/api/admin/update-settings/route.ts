/**
 * POST /api/admin/update-settings
 * Updates one or more site_settings rows. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { updates } = (await request.json()) as { updates: Array<{ key: string; value: string }> };
  if (!Array.isArray(updates))
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });

  for (const { key, value } of updates) {
    const { error } = await admin
      .from('site_settings')
      .update({ value: value ?? '' })
      .eq('key', key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
