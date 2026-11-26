/**
 * POST /api/reviews
 *
 * Public endpoint for customers to submit a product review.
 * No auth required — customer identified by name + optional order number.
 *
 * Rate-limit: one pending/approved review per customer_name per product.
 * Verified Purchase badge: set when order_id is provided and the order
 * contains the product being reviewed.
 *
 * Body:
 *   product_id    string   (required)
 *   customer_name string   (required)
 *   rating        1–5      (required)
 *   body          string   (optional)
 *   order_id      string   (optional — for Verified Purchase check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitReview } from '@/lib/db/reviews';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;

  const productId = (body.product_id as string | undefined)?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required.' }, { status: 400 });
  }

  const customerName = (body.customer_name as string | undefined)?.trim();
  if (!customerName) {
    return NextResponse.json({ error: 'customer_name is required.' }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'rating must be an integer between 1 and 5.' },
      { status: 400 }
    );
  }

  const reviewBody = (body.body as string | undefined)?.trim() || undefined;
  const orderId = (body.order_id as string | undefined)?.trim() || undefined;

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
        { error: 'You have already submitted a review for this product.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
