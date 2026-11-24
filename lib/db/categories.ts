/**
 * lib/db/categories.ts
 *
 * Server-side category and subcategory query functions.
 */

import { createClient } from '@/lib/supabase/server';

export async function listCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`listCategories: ${error.message}`);
  return data ?? [];
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getCategoryBySlug: ${error.message}`);
  }
  return data;
}

export async function listSubcategories(categoryId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('subcategories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error } = await query;
  if (error) throw new Error(`listSubcategories: ${error.message}`);
  return data ?? [];
}

export async function getSubcategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subcategories')
    .select('*, categories(id, name, slug)')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getSubcategoryBySlug: ${error.message}`);
  }
  return data;
}

export async function getCategoriesWithSubcategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*, subcategories(*)')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`getCategoriesWithSubcategories: ${error.message}`);
  return data ?? [];
}
