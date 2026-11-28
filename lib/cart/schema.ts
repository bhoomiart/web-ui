/**
 * lib/cart/schema.ts
 *
 * Input parsing for cart API bodies. Rejects anything malformed instead of
 * guessing, merges duplicate lines, and drops every field we do not use
 * (prices, names and images from the client are ignored).
 */

import { MAX_CART_LINES, MAX_LINE_QTY } from './constants';
import { cartLineKey, type CartLineInput } from './types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Quantity must be a whole number from 1 to MAX_LINE_QTY. */
export function parseQuantity(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < 1 || value > MAX_LINE_QTY) return null;
  return value;
}

export function parseLine(raw: unknown): ParseResult<CartLineInput> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid cart line.' };
  const r = raw as Record<string, unknown>;

  if (!isUuid(r.productId)) return { ok: false, error: 'Invalid product.' };
  if (r.variantId != null && !isUuid(r.variantId)) return { ok: false, error: 'Invalid variant.' };

  const quantity = parseQuantity(r.quantity);
  if (quantity == null) {
    return { ok: false, error: `Quantity must be a whole number from 1 to ${MAX_LINE_QTY}.` };
  }

  return {
    ok: true,
    value: { productId: r.productId, variantId: (r.variantId as string | null) ?? null, quantity },
  };
}

/** Parses `{ items: [...] }`. Same product+variant lines are summed (capped at MAX_LINE_QTY). */
export function parseLines(raw: unknown): ParseResult<CartLineInput[]> {
  if (!Array.isArray(raw)) return { ok: false, error: 'items must be an array.' };
  if (raw.length === 0) return { ok: true, value: [] };
  if (raw.length > MAX_CART_LINES) {
    return { ok: false, error: `A cart can hold at most ${MAX_CART_LINES} different items.` };
  }

  const merged = new Map<string, CartLineInput>();
  for (const entry of raw) {
    const parsed = parseLine(entry);
    if (!parsed.ok) return parsed;
    const key = cartLineKey(parsed.value.productId, parsed.value.variantId);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(MAX_LINE_QTY, existing.quantity + parsed.value.quantity);
    } else {
      merged.set(key, { ...parsed.value });
    }
  }
  return { ok: true, value: [...merged.values()] };
}

/** Delivery state: trimmed, bounded, or null. Matching happens against the rates table. */
export function parseState(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s.length > 0 && s.length <= 60 ? s : null;
}
