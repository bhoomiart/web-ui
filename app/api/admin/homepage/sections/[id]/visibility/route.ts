/**
 * PATCH /api/admin/homepage/sections/[id]/visibility
 * Body: { is_visible: boolean }
 * Toggles a homepage section's visibility. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { is_visible } = (await request.json()) as { is_visible: boolean };

  const admin = createAdminClient();
  const { error } = await admin.from('homepage_sections').update({ is_visible }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
