/**
 * lib/db/products.ts
 *
 * Server-side product query functions.
 * Called ONLY from Server Components, Server Actions, or Route Handlers.
 * Never imported in client components.
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';

type Product = Database['public']['Tables']['products']['Row'];
type ProductMedia = Database['public']['Tables']['product_media']['Row'];

export interface ProductWithMedia extends Product {
  product_media: ProductMedia[];
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function listProducts({
  status = 'active' as const,
  limit = 24,
  offset = 0,
  orderBy = 'created_at' as keyof Product,
  ascending = false,
}: {
  status?: 'active' | 'draft' | 'archived';
  limit?: number;
  offset?: number;
  orderBy?: keyof Product;
  ascending?: boolean;
} = {}) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from('products')
    .select('*, product_media(url, alt_text, media_type, display_order)', { count: 'exact' })
    .eq('status', status)
    .order(orderBy as string, { ascending })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`listProducts: ${error.message}`);
  return { products: data ?? [], total: count ?? 0 };
}

export async function listFeaturedProducts(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_media(url, alt_text, media_type, display_order)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listFeaturedProducts: ${error.message}`);
  return data ?? [];
}

export async function listNewArrivals(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_media(url, alt_text, media_type, display_order)')
    .eq('status', 'active')
    .eq('is_new_arrival', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listNewArrivals: ${error.message}`);
  return data ?? [];
}

export async function listBestsellers(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_media(url, alt_text, media_type, display_order)')
    .eq('status', 'active')
    .eq('is_bestseller', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listBestsellers: ${error.message}`);
  return data ?? [];
}

// ─── Single product ───────────────────────────────────────────────────────────

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_media(id, url, alt_text, media_type, display_order),
      product_variants(id, name, sku, price_modifier, attributes, status),
      product_tag_map(tag_id, product_tags(id, name, slug)),
      product_category_map(category_id, categories(id, name, slug)),
      product_subcategory_map(subcategory_id, subcategories(id, name, slug))
    `
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`getProductBySlug: ${error.message}`);
  }
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_media(id, url, alt_text, media_type, display_order),
      product_variants(id, name, sku, price_modifier, attributes, status)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getProductById: ${error.message}`);
  }
  return data;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export async function getProductRecommendations(
  productId: string,
  type: 'related' | 'you_may_also_like' | 'frequently_bought_together',
  limit = 6
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_recommendations')
    .select(
      `
      type,
      display_order,
      recommended:recommended_id(
        id, name, slug, price, availability_type, is_featured, is_signature,
        product_media(url, alt_text, media_type, display_order)
      )
    `
    )
    .eq('product_id', productId)
    .eq('type', type)
    .order('display_order')
    .limit(limit);

  if (error) throw new Error(`getProductRecommendations: ${error.message}`);
  return data ?? [];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchProducts(query: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, availability_type, product_media(url, alt_text)')
    .eq('status', 'active')
    .textSearch('name', query, { type: 'websearch', config: 'english' })
    .limit(limit);

  if (error) throw new Error(`searchProducts: ${error.message}`);
  return data ?? [];
}

// ─── Collection products ──────────────────────────────────────────────────────

export async function getCollectionProducts(collectionSlug: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select(
      `
      id, name, slug, description,
      collection_products(
        display_order,
        products(
          id, name, slug, price, availability_type, is_featured, is_signature, is_bestseller, is_new_arrival,
          product_media(url, alt_text, media_type, display_order)
        )
      )
    `
    )
    .eq('slug', collectionSlug)
    .eq('is_visible', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getCollectionProducts: ${error.message}`);
  }
  return data;
}
