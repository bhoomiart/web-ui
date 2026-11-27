/**
 * GET /api/admin/inventory/history/export — CSV of inventory movements (A4-T3-3)
 * Admin or staff access required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/api/auth';
import { listInventoryMovements } from '@/lib/db/inventory';

function cell(value: unknown): string {
  let s = value == null ? '' : String(value);
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffApi(request);
  if (auth instanceof NextResponse) return auth;

  const movements = await listInventoryMovements(undefined, 5000);
  type Row = (typeof movements)[number] & {
    inventory: { products: { name: string } | null } | null;
  };
  const header = ['Date', 'Product', 'Type', 'Before', 'Change', 'After', 'Order ID', 'Reason'];
  const lines = (movements as Row[]).map((m) =>
    [
      m.created_at,
      m.inventory?.products?.name,
      m.change_type,
      m.previous_qty,
      m.change_qty,
      m.new_qty,
      m.order_id,
      m.reason,
    ]
      .map(cell)
      .join(',')
  );
  const csv = [header.map(cell).join(','), ...lines].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inventory-history-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
