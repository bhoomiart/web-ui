/**
 * PATCH  /api/admin/collections/[id] — Update collection or manage products.
 *   body: { name, slug, ... }             → update metadata
 *   body: { action: 'add', product_id }   → add product to collection
 *   body: { action: 'remove', product_id }→ remove product from collection
 * DELETE /api/admin/collections/[id]      — Delete collection. Admin only.
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

  if (body.action === 'add') {
    const { error } = await admin
      .from('collection_products')
      .upsert({
        collection_id: id,
        product_id: body.product_id as string,
        display_order: (body.display_order as number) ?? 0,
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'remove') {
    const { error } = await admin
      .from('collection_products')
      .delete()
      .eq('collection_id', id)
      .eq('product_id', body.product_id as string);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update collection metadata
  const { error } = await admin
    .from('collections')
    .update({
      name: body.name,
      slug: body.slug,
      type: body.type,
      description: (body.description as string) || null,
      is_visible: body.is_visible !== false,
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
  const { error } = await admin.from('collections').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
