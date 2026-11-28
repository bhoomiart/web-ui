/**
 * GET /api/stock?ids=<uuid>,<uuid>,...   (max 48 ids)
 *
 * Live availability for product cards and the product page.
 * Public, read-only, never cached. Display only: adding to the cart and
 * checkout re-check stock on the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isUuid } from '@/lib/cart/schema';
import { getStockForProducts } from '@/lib/cart/stock';
import { clientIp, rateLimit } from '@/lib/api/rateLimit';

const MAX_IDS = 48;

export async function GET(request: NextRequest) {
  if (!rateLimit(`stock:${clientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const raw = request.nextUrl.searchParams.get('ids') ?? '';
  const ids = raw.split(',').filter(Boolean);

  if (ids.length === 0 || ids.length > MAX_IDS || !ids.every(isUuid)) {
    return NextResponse.json(
      { error: `Provide 1 to ${MAX_IDS} valid product ids.` },
      { status: 400 }
    );
  }

  try {
    const stock = await getStockForProducts(ids);
    return NextResponse.json({ stock }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load availability.' }, { status: 500 });
  }
}
