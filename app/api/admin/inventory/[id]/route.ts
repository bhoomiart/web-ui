/**
 * PATCH /api/admin/inventory/[id]
 *
 * Supported actions (determined by the `action` body field):
 *   - "adjust"   — manually adjust stock quantity (calls adjust_stock_manual RPC)
 *   - "settings" — update low_stock_threshold and/or tracking_enabled
 *
 * Admin or staff access required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { adjustStock } from '@/lib/db/inventory';

type Params = { params: Promise<{ id: string }> };

const VALID_CHANGE_TYPES = [
  'restock',
  'production',
  'damaged',
  'manual_correction',
  'return_restocked',
] as const;

type ValidChangeType = (typeof VALID_CHANGE_TYPES)[number];

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id: inventoryId } = await params;
  if (!inventoryId) {
    return NextResponse.json({ error: 'Inventory ID is required.' }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string | undefined;

  // ── adjust: manual stock change ────────────────────────────────────────────
  if (action === 'adjust') {
    const changeQty = Number(body.change_qty);
    if (!Number.isInteger(changeQty) || changeQty === 0) {
      return NextResponse.json(
        { error: 'change_qty must be a non-zero integer.' },
        { status: 400 }
      );
    }

    const changeType = body.change_type as string | undefined;
    if (!changeType || !VALID_CHANGE_TYPES.includes(changeType as ValidChangeType)) {
      return NextResponse.json(
        {
          error: `change_type must be one of: ${VALID_CHANGE_TYPES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const reason = (body.reason as string | undefined)?.trim() ?? '';

    try {
      await adjustStock({
        inventoryId,
        changeQty,
        changeType: changeType as ValidChangeType,
        reason,
        actorId: auth.user.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // DB function raises an error when stock would go below zero
      if (message.includes('insufficient') || message.includes('below zero')) {
        return NextResponse.json(
          { error: 'Adjustment would bring stock below zero.' },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Audit log
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'inventory.adjust',
      table_name: 'inventory',
      record_id: inventoryId,
      diff: { change_qty: changeQty, change_type: changeType, reason } as never,
    });

    return NextResponse.json({ success: true });
  }

  // ── settings: update threshold / tracking ─────────────────────────────────
  if (action === 'settings') {
    type InventoryUpdate = {
      low_stock_threshold?: number;
      tracking_enabled?: boolean;
    };
    const updates: InventoryUpdate = {};
    const diffRecord: Record<string, number | boolean> = {};

    if (body.low_stock_threshold !== undefined) {
      const threshold = Number(body.low_stock_threshold);
      if (!Number.isInteger(threshold) || threshold < 0) {
        return NextResponse.json(
          { error: 'low_stock_threshold must be a non-negative integer.' },
          { status: 400 }
        );
      }
      updates.low_stock_threshold = threshold;
      diffRecord.low_stock_threshold = threshold;
    }

    if (body.tracking_enabled !== undefined) {
      const enabled = Boolean(body.tracking_enabled);
      updates.tracking_enabled = enabled;
      diffRecord.tracking_enabled = enabled;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('inventory').update(updates).eq('id', inventoryId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'inventory.settings',
      table_name: 'inventory',
      record_id: inventoryId,
      diff: diffRecord as never,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Unknown action. Use "adjust" or "settings".' },
    { status: 400 }
  );
}
