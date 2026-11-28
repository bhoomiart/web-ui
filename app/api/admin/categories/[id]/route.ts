/**
 * PATCH  /api/admin/categories/[id] — Update a category. Admin only.
 * DELETE /api/admin/categories/[id] — Delete a category. Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseImageUrl } from '@/lib/api/imageUrl';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const admin = createAdminClient();

  const { error } = await admin
    .from('categories')
    .update({
      name: body.name,
      slug: body.slug,
      description: (body.description as string) || null,
      is_visible: body.is_visible !== false,
      display_order: Number(body.display_order ?? 0),
      image_url: parseImageUrl(body.image_url),
      seo_title: (body.seo_title as string) || null,
      seo_description: (body.seo_description as string) || null,
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

  const { error } = await admin.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
