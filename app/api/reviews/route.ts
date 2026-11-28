/**
 * POST /api/reviews
 *
 * Public endpoint for customers to review a product they received.
 * A review is accepted only when the order (order_number + phone, same as
 * /api/track) exists, is delivered, and contains the product. One review per
 * product per order. Reviews start as "pending" for moderation.
 *
 * Body:
 *   product_id    string   (required)
 *   order_number  string   (required)
 *   phone         string   (required)
 *   customer_name string   (optional — defaults to the order's customer name)
 *   rating        1–5      (required)
 *   body          string   (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitReview } from '@/lib/db/reviews';
import { getOrderByPhoneAndNumber } from '@/lib/db/orders';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;

  const productId = (body.product_id as string | undefined)?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required.' }, { status: 400 });
  }

  const orderNumber = (body.order_number as string | undefined)?.trim();
  const phone = (body.phone as string | undefined)?.trim();
  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: 'Reviews can only be submitted from a delivered order.' },
      { status: 400 }
    );
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'rating must be an integer between 1 and 5.' },
      { status: 400 }
    );
  }

  const reviewBody = (body.body as string | undefined)?.trim() || undefined;

  const order = await getOrderByPhoneAndNumber(phone.replace(/\s/g, ''), orderNumber.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: 'No order found with those details.' }, { status: 404 });
  }
  const lines = order.order_items as Array<{ status: string; products: { id: string } | null }>;
  const line = lines.find((i) => i.products?.id === productId);
  if (!line) {
    return NextResponse.json({ error: 'This product is not part of that order.' }, { status: 403 });
  }
  if (line.status !== 'delivered') {
    return NextResponse.json(
      { error: 'You can review a product once it has been delivered.' },
      { status: 403 }
    );
  }
  const customerName = (
    (body.customer_name as string | undefined)?.trim() ||
    order.customer_name ||
    ''
  ).slice(0, 80);
  if (!customerName) {
    return NextResponse.json({ error: 'customer_name is required.' }, { status: 400 });
  }
  const orderId = order.id;

  try {
    const review = await submitReview({
      productId,
      customerName,
      rating,
      body: reviewBody,
      orderId,
    });

    return NextResponse.json(
      { review, message: 'Your review has been submitted and is pending approval.' },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already exists')) {
      return NextResponse.json(
        { error: 'You have already reviewed this product for this order.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
