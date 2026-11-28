'use client';

/**
 * lib/cart/stockClient.ts
 *
 * Browser-side live stock loader. Many product cards on one page share a
 * single request (ids are collected for a few milliseconds and sent together),
 * and results are cached briefly so scrolling or re-rendering does not refetch.
 *
 * Failure is quiet: when stock is unknown the UI does not block anything,
 * because adding to the cart is validated on the server anyway.
 */

import * as React from 'react';
import type { StockInfo } from './types';

const TTL_MS = 15_000;
const BATCH_MS = 25;
const MAX_IDS = 48;

const cache = new Map<string, { info: StockInfo | null; at: number }>();
const waiting = new Map<string, Array<(info: StockInfo | null) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  const ids = [...waiting.keys()];
  const callbacks = new Map(waiting);
  waiting.clear();

  for (let i = 0; i < ids.length; i += MAX_IDS) {
    const chunk = ids.slice(i, i + MAX_IDS);
    let stock: Record<string, StockInfo> = {};
    try {
      const res = await fetch(`/api/stock?ids=${chunk.join(',')}`, { cache: 'no-store' });
      if (res.ok) stock = ((await res.json()) as { stock: Record<string, StockInfo> }).stock;
    } catch {
      /* unknown stock is not an error for the shopper */
    }
    for (const id of chunk) {
      const info = stock[id] ?? null;
      if (info) cache.set(id, { info, at: Date.now() });
      callbacks.get(id)?.forEach((cb) => cb(info));
    }
  }
}

export function loadStock(productId: string, force = false): Promise<StockInfo | null> {
  const hit = cache.get(productId);
  if (!force && hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.info);

  return new Promise((resolve) => {
    const list = waiting.get(productId) ?? [];
    list.push(resolve);
    waiting.set(productId, list);
    if (!timer) timer = setTimeout(flush, BATCH_MS);
  });
}

/** Drop the cached value so the next read refetches (used after adding to cart). */
export function invalidateStock(productId: string) {
  cache.delete(productId);
}

/**
 * Live stock for one product.
 * @param initial server-rendered value, shown immediately
 * @param refreshOnFocus refetch when the tab regains focus (product page)
 */
export function useProductStock(
  productId: string,
  initial?: StockInfo | null,
  refreshOnFocus = false
): StockInfo | null | undefined {
  const [info, setInfo] = React.useState<StockInfo | null | undefined>(
    initial ?? cache.get(productId)?.info
  );

  React.useEffect(() => {
    let alive = true;
    // Product pages already rendered fresh data on the server, so skip the first fetch there.
    const skipFirst = refreshOnFocus && initial != null;
    if (!skipFirst) {
      void loadStock(productId).then((v) => {
        if (alive && v) setInfo(v);
      });
    }

    function onFocus() {
      void loadStock(productId, true).then((v) => {
        if (alive && v) setInfo(v);
      });
    }
    if (refreshOnFocus) window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      if (refreshOnFocus) window.removeEventListener('focus', onFocus);
    };
    // initial is only used for the first paint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, refreshOnFocus]);

  return info;
}

/** Re-read stock now and push it to a setter. Used after a failed or capped add. */
export async function refreshStock(productId: string): Promise<StockInfo | null> {
  invalidateStock(productId);
  return loadStock(productId, true);
}
