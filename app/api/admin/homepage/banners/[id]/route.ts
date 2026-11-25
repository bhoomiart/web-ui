/**
 * PATCH  /api/admin/homepage/banners/[id] — Update a banner. Admin only.
 * DELETE /api/admin/homepage/banners/[id] — Delete a banner. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const admin = createAdminClient();

  const { error } = await admin
    .from('banners')
    .update({
      image_url: body.image_url,
      title: (body.title as string) || null,
      subtitle: (body.subtitle as string) || null,
      cta_text: (body.cta_text as string) || null,
      cta_url: (body.cta_url as string) || null,
      is_active: body.is_active !== false,
      display_order: Number(body.display_order ?? 0),
    } as never)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
