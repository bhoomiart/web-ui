/**
 * PATCH  /api/admin/pages/[id] — Update publish status. Admin only.
 * DELETE /api/admin/pages/[id] — Delete page. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as { is_published?: boolean };
  const admin = createAdminClient();

  const { error } = await admin
    .from('pages')
    .update({ is_published: body.is_published } as never)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('pages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
