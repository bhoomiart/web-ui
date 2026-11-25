/**
 * DELETE /api/admin/media/[id] — Delete a product media item. Admin/staff.
 * PATCH  /api/admin/media/[id] — Update display order. Admin/staff.
 *
 * Also handles bulk reorder via PATCH with { items: [{id, display_order}] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch URL first so caller can optionally clean up storage
  const { data: media } = await admin.from('product_media').select('url').eq('id', id).single();

  const { error } = await admin.from('product_media').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, url: media?.url });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as {
    display_order?: number;
    items?: Array<{ id: string; display_order: number }>;
  };
  const admin = createAdminClient();

  // Bulk reorder: ignore the [id] param, use the items array
  if (body.items) {
    await Promise.all(
      body.items.map(({ id: itemId, display_order }) =>
        admin.from('product_media').update({ display_order }).eq('id', itemId)
      )
    );
    return NextResponse.json({ ok: true });
  }

  // Single item update
  const { error } = await admin
    .from('product_media')
    .update({ display_order: body.display_order })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
