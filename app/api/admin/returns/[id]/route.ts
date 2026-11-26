/**
 * PATCH /api/admin/returns/[id]
 *
 * Update return request status.
 * Body: { status: 'approved'|'rejected'|'in_transit'|'completed', admin_notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { updateReturnStatus } from '@/lib/db/orders';
import { adjustStock } from '@/lib/db/inventory';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    admin_notes?: string;
    restock?: boolean; // when status=completed, optionally restock items
  };

  const validStatuses = ['approved', 'rejected', 'in_transit', 'completed'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(', ')}.` },
      { status: 400 }
    );
  }

  try {
    await updateReturnStatus({
      returnId: id,
      status: body.status as 'approved' | 'rejected' | 'in_transit' | 'completed',
      adminNotes: body.admin_notes,
      actorId: auth.user.id,
    });

    // Restock on explicit admin request after inspection (A6-T5-6)
    if (body.status === 'completed' && body.restock) {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      const { data: items } = await admin
        .from('return_request_items')
        .select('quantity, order_items(product_id, variant_id)')
        .eq('return_request_id', id);

      for (const item of items ?? []) {
        const oi = item.order_items as { product_id: string; variant_id: string | null } | null;
        if (!oi) continue;
        const { data: inv } = await admin
          .from('inventory')
          .select('id')
          .eq('product_id', oi.product_id)
          .is('variant_id', oi.variant_id as null)
          .single();
        if (!inv) continue;
        await adjustStock({
          inventoryId: inv.id,
          changeQty: item.quantity,
          changeType: 'return_restocked',
          reason: `Return request ${id} completed`,
          actorId: auth.user.id,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
