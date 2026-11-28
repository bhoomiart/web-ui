/**
 * lib/db/reviews.ts
 *
 * Server-side review query and mutation functions.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type MediaRow = { url: string; alt_text?: string | null };

/**
 * Review photos are stored as private storage paths. Replace each with a signed URL.
 * Entries that are already full URLs (older data) are left as they are.
 */
async function signReviewMedia<T extends { review_media: MediaRow[] | null }>(
  reviews: T[],
  expiresIn: number
): Promise<T[]> {
  const paths = reviews.flatMap((r) =>
    (r.review_media ?? []).map((m) => m.url).filter((u) => !/^https?:/.test(u))
  );
  if (paths.length === 0) return reviews;
  const admin = createAdminClient();
  const { data } = await admin.storage.from('customer-uploads').createSignedUrls(paths, expiresIn);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return reviews.map((r) => ({
    ...r,
    review_media: (r.review_media ?? []).flatMap((m) => {
      if (/^https?:/.test(m.url)) return [m];
      const url = byPath.get(m.url);
      return url ? [{ ...m, url }] : [];
    }),
  }));
}

export type ReviewSortOrder = 'newest' | 'highest' | 'lowest';

// ─── Public read ──────────────────────────────────────────────────────────

export async function listProductReviews(
  productId: string,
  sort: ReviewSortOrder = 'newest',
  limit = 20,
  offset = 0
) {
  const supabase = await createClient();

  const orderCol = sort === 'newest' ? 'created_at' : sort === 'highest' ? 'rating' : 'rating';
  const asc = sort === 'lowest';

  const { data, error, count } = await supabase
    .from('product_reviews')
    .select('*, review_media(url, alt_text)', { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order(orderCol, { ascending: asc })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`listProductReviews: ${error.message}`);
  const reviews = await signReviewMedia(data ?? [], 6 * 3600);
  return { reviews, total: count ?? 0 };
}

export async function getProductRatingSummary(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');

  if (error) throw new Error(`getProductRatingSummary: ${error.message}`);

  const reviews = data ?? [];
  const count = reviews.length;
  if (count === 0) return { count: 0, average: 0, distribution: {} };

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const distribution: Record<number, number> = {};
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
  }

  return {
    count,
    average: Math.round((sum / count) * 10) / 10,
    distribution,
  };
}

// ─── Submit review ────────────────────────────────────────────────────────

export interface SubmitReviewInput {
  productId: string;
  orderId?: string;
  customerName: string;
  rating: number;
  body?: string;
  imageUrls?: string[];
}

export async function submitReview(input: SubmitReviewInput) {
  const admin = createAdminClient();

  // Duplicate check: per order when the review is tied to an order, else per name
  let dupQuery = admin
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', input.productId)
    .in('status', ['pending', 'approved']);
  dupQuery = input.orderId
    ? dupQuery.eq('order_id', input.orderId)
    : dupQuery.eq('customer_name', input.customerName);
  const { count } = await dupQuery;

  if ((count ?? 0) > 0) {
    throw new Error('A review from this customer already exists for this product.');
  }

  // Determine verified purchase
  let isVerifiedPurchase = false;
  if (input.orderId) {
    const { count: orderCount } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', input.productId)
      // confirm the order belongs to this customer via the order
      .eq('order_id', input.orderId);

    isVerifiedPurchase = (orderCount ?? 0) > 0;
  }

  const { data: review, error } = await admin
    .from('product_reviews')
    .insert({
      product_id: input.productId,
      order_id: input.orderId ?? null,
      customer_name: input.customerName,
      rating: input.rating,
      body: input.body ?? null,
      status: 'pending',
      is_verified_purchase: isVerifiedPurchase,
    })
    .select()
    .single();

  if (error) throw new Error(`submitReview: ${error.message}`);

  // Insert review media if provided
  if (input.imageUrls && input.imageUrls.length > 0) {
    await admin
      .from('review_media')
      .insert(input.imageUrls.map((url) => ({ review_id: review.id, url })));
  }

  return review;
}

// ─── Admin moderation ─────────────────────────────────────────────────────

export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'rejected' | 'hidden',
  adminResponse?: string
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('product_reviews')
    .update({
      status: status as 'pending' | 'approved' | 'rejected' | 'hidden',
      admin_response: adminResponse ?? null,
    })
    .eq('id', reviewId);

  if (error) throw new Error(`moderateReview: ${error.message}`);
}

export async function listAllReviews({
  status,
  limit = 20,
  offset = 0,
}: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const admin = createAdminClient();
  let query = admin
    .from('product_reviews')
    .select('*, review_media(url), products(id, name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as never);

  const { data, error, count } = await query;
  if (error) throw new Error(`listAllReviews: ${error.message}`);
  const reviews = await signReviewMedia(data ?? [], 3600);
  return { reviews, total: count ?? 0 };
}
