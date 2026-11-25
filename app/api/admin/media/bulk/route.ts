/**
 * PATCH /api/admin/media/bulk
 * Body: { items: Array<{ id: string; display_order: number }> }
 * Reorders multiple product_media rows atomically. Staff only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { items } = (await request.json()) as {
    items?: Array<{ id: string; display_order: number }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  await Promise.all(
    items.map(({ id, display_order }) =>
      admin.from('product_media').update({ display_order }).eq('id', id)
    )
  );

  return NextResponse.json({ ok: true });
}
