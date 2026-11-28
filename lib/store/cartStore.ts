/**
 * lib/store/cartStore.ts
 *
 * Cart state for the storefront. Two modes:
 *
 *   guest      Lines live in localStorage. Every add and quantity increase is
 *              checked against live stock through POST /api/cart/validate.
 *   signed in  The server cart (tables carts / cart_items) is the source of
 *              truth. This store is an optimistic cache of it, so the cart
 *              follows the customer across devices.
 *
 * On sign-in the guest lines are merged into the server cart once
 * (POST /api/cart/merge). On sign-out the local cart is wiped so the next
 * person on a shared device does not see it.
 *
 * Prices and stock shown here always come from the server. The client never
 * decides what an item costs or how many can be bought.
 *
 * All mutations run one at a time through a queue, so rapid clicks cannot
 * interleave requests and leave the cart in a mixed state.
 *
 * Cart lines are keyed by `${productId}::${variantId ?? 'base'}`.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MAX_LINE_QTY } from '@/lib/cart/constants';
import {
  cartLineKey,
  countsTowardTotal,
  isPurchasable,
  type CartSnapshot,
  type CartTotals,
  type LineStatus,
  type MergeReport,
  type ValidatedLine,
} from '@/lib/cart/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  /** Composite key: `${productId}::${variantId ?? 'base'}` */
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  /** Unit price from the server (product price + variant modifier) */
  price: number;
  quantity: number;
  image: string | null;
  slug: string;
  /** 'ready_to_ship' | 'made_to_order' */
  availabilityType: string;
  /** cart_items.id, present in server mode */
  itemId?: string;
  status?: LineStatus;
  message?: string | null;
  /** Units that can be bought now. null = not stock-limited. */
  availableQty?: number | null;
  /** Highest quantity the stepper may offer */
  maxQty?: number;
}

export interface CartNotice {
  id: number;
  variant: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export type AddInput = Pick<
  CartItem,
  | 'productId'
  | 'variantId'
  | 'name'
  | 'variantName'
  | 'price'
  | 'image'
  | 'slug'
  | 'availabilityType'
> & { quantity?: number };

export interface ActionResult {
  ok: boolean;
  /** Quantity of this line in the cart afterwards */
  quantity?: number;
  /** Shown to the shopper (inline or toast) */
  message?: string;
  code?: 'NETWORK' | 'AUTH' | 'OUT_OF_STOCK' | 'UNAVAILABLE' | 'AT_MAX' | 'ERROR';
}

type Source = 'guest' | 'server';

interface CartState {
  items: CartItem[];
  source: Source;
  authed: boolean;
  totals: CartTotals | null;
  shippingState: string | null;
  /** Line keys with a request in flight */
  pending: string[];
  syncing: boolean;
  lastSyncedAt: number | null;
  notices: CartNotice[];

  addItem: (item: AddInput) => Promise<ActionResult>;
  updateQty: (key: string, quantity: number) => Promise<ActionResult>;
  removeItem: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  /** Re-check every line against live stock and prices. */
  syncWithServer: (opts?: { notify?: boolean; force?: boolean }) => Promise<boolean>;
  setShippingState: (state: string | null) => void;

  /** Called by <CartSync> */
  handleSignedIn: () => Promise<void>;
  handleSignedOut: () => void;
  dismissNotice: (id: number) => void;

  /** Total units, counting lines that can be bought */
  itemCount: () => number;
  /** Sum of price × quantity for lines that can be bought */
  subtotal: () => number;
  /** True when every line can be bought exactly as requested */
  isValid: () => boolean;
  /** Lines that need the customer's attention */
  issues: () => CartItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const NETWORK_MESSAGE = "Couldn't check availability. Please check your connection and try again.";

interface ApiResult<T> {
  ok: boolean;
  status: number;
  body: T | null;
}

async function api<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const body = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  } finally {
    clearTimeout(timer);
  }
}

function toItem(line: ValidatedLine, prev?: CartItem): CartItem {
  return {
    key: line.key,
    productId: line.productId,
    variantId: line.variantId,
    name: line.status === 'unavailable' ? (prev?.name ?? line.name) : line.name,
    variantName: line.variantName ?? prev?.variantName ?? null,
    price: line.unitPrice ?? prev?.price ?? 0,
    quantity: line.quantity,
    image: line.image ?? prev?.image ?? null,
    slug: line.slug || prev?.slug || '',
    availabilityType:
      line.availabilityType === 'unknown'
        ? (prev?.availabilityType ?? 'unknown')
        : line.availabilityType,
    itemId: line.itemId,
    status: line.status,
    message: line.message,
    availableQty: line.availableQty,
    maxQty: line.maxQty,
  };
}

/** Mutations run one at a time. A failed step never blocks the next one. */
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

// Auth readiness: mutations wait briefly for <CartSync> to learn whether a
// customer is signed in, so the first click after page load uses the right mode.
let authReadyResolve: () => void = () => undefined;
let authReadyDone = false;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});
export function markCartAuthReady() {
  authReadyDone = true;
  authReadyResolve();
}

/**
 * The sign-in handler must run BEFORE any queued cart action while auth is
 * still unknown. Otherwise a click made during page load would wait for auth,
 * the merge would wait behind that click, and nothing would proceed until the
 * wait timed out. Once auth is known it joins the normal queue.
 */
function runAuthStep<T>(fn: () => Promise<T>): Promise<T> {
  return authReadyDone ? enqueue(fn) : fn();
}
const whenAuthReady = () =>
  Promise.race([authReadyPromise, new Promise<void>((r) => setTimeout(r, 2500))]);

let noticeSeq = 0;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // ── internal helpers (close over set/get) ──────────────────────────────

      const notify = (n: Omit<CartNotice, 'id'>) =>
        set((s) => ({ notices: [...s.notices, { ...n, id: ++noticeSeq }].slice(-5) }));

      const setPending = (key: string, on: boolean) =>
        set((s) => ({
          pending: on ? [...new Set([...s.pending, key])] : s.pending.filter((k) => k !== key),
        }));

      /**
       * Replace the cart with a server snapshot. With `announce`, differences
       * from what the shopper last saw become notices (price moved, quantity
       * reduced, item sold out).
       */
      const applySnapshot = (snapshot: CartSnapshot, announce: boolean) => {
        const prevItems = get().items;
        const prevByKey = new Map(prevItems.map((i) => [i.key, i]));
        const next = snapshot.lines.map((l) => toItem(l, prevByKey.get(l.key)));

        if (announce) {
          for (const item of next) {
            const prev = prevByKey.get(item.key);
            if (
              prev &&
              item.status !== 'unavailable' &&
              prev.price !== item.price &&
              prev.price > 0 &&
              item.price > 0
            ) {
              notify({
                variant: 'warning',
                title: 'Price updated',
                message: `${item.name} is now ${fmt(item.price)} (was ${fmt(prev.price)}).`,
              });
            }
            if (item.status === 'adjusted' && item.message) {
              notify({
                variant: 'warning',
                title: 'Quantity changed',
                message: `${item.name}: ${item.message}`,
              });
            } else if (
              (item.status === 'out_of_stock' || item.status === 'unavailable') &&
              prev?.status !== item.status
            ) {
              notify({
                variant: 'warning',
                title: item.status === 'out_of_stock' ? 'Item sold out' : 'Item unavailable',
                message: `${item.name} can't be ordered right now. Remove it to continue.`,
              });
            }
          }
        }

        set({ items: next, totals: snapshot.totals, lastSyncedAt: Date.now() });
      };

      /** Server cart said we are not signed in any more. */
      const sessionExpired = () => {
        set({ authed: false, source: 'guest', items: [], totals: null, pending: [] });
        notify({
          variant: 'info',
          title: 'Please sign in again',
          message: 'Your session has ended. Sign in to see your saved cart.',
        });
      };

      const validateGuest = async (
        lines: Array<{ productId: string; variantId: string | null; quantity: number }>
      ) =>
        api<CartSnapshot>('/api/cart/validate', {
          method: 'POST',
          body: JSON.stringify({ items: lines, state: get().shippingState }),
        });

      // ── guest mode ─────────────────────────────────────────────────────────

      const guestSetQuantity = async (
        input: AddInput,
        desired: number,
        existing: CartItem | undefined
      ): Promise<ActionResult> => {
        const res = await validateGuest([
          { productId: input.productId, variantId: input.variantId, quantity: desired },
        ]);
        const line = res.body?.lines?.[0];
        if (!res.ok || !line) return { ok: false, code: 'NETWORK', message: NETWORK_MESSAGE };

        if (line.status === 'out_of_stock' || line.status === 'unavailable') {
          if (existing) {
            set((s) => ({
              items: s.items.map((i) => (i.key === line.key ? toItem(line, i) : i)),
            }));
          }
          return {
            ok: false,
            code: line.status === 'out_of_stock' ? 'OUT_OF_STOCK' : 'UNAVAILABLE',
            message: line.message ?? 'This item cannot be added.',
          };
        }

        const merged = toItem(line, existing);
        // Display data from the caller fills gaps (slug/image are always server-sourced, but be safe)
        if (!merged.slug) merged.slug = input.slug;
        if (!merged.image) merged.image = input.image;

        set((s) => {
          const has = s.items.some((i) => i.key === merged.key);
          return {
            items: has
              ? s.items.map((i) => (i.key === merged.key ? merged : i))
              : [...s.items, merged],
            totals: null,
          };
        });

        return {
          ok: true,
          quantity: line.quantity,
          message: line.status === 'adjusted' ? (line.message ?? undefined) : undefined,
        };
      };

      // ── server mode ────────────────────────────────────────────────────────

      interface PutBody {
        snapshot?: CartSnapshot;
        notice?: { type: string; message: string };
        error?: string;
        code?: string;
      }

      const serverPut = async (
        input: { productId: string; variantId: string | null },
        quantity: number,
        mode: 'set' | 'add'
      ): Promise<ActionResult> => {
        const key = cartLineKey(input.productId, input.variantId);
        const res = await api<PutBody>('/api/cart/items', {
          method: 'PUT',
          body: JSON.stringify({ ...input, quantity, mode, state: get().shippingState }),
        });

        if (res.status === 401) {
          sessionExpired();
          return { ok: false, code: 'AUTH', message: 'Please sign in to continue.' };
        }
        if (res.status === 0) return { ok: false, code: 'NETWORK', message: NETWORK_MESSAGE };

        if (res.body?.snapshot) applySnapshot(res.body.snapshot, false);

        if (res.status === 409) {
          return {
            ok: false,
            code: res.body?.code === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'UNAVAILABLE',
            message: res.body?.error ?? 'This item cannot be added.',
          };
        }
        if (!res.ok)
          return { ok: false, code: 'ERROR', message: res.body?.error ?? 'Something went wrong.' };

        const line = res.body?.snapshot?.lines.find((l) => l.key === key);
        return {
          ok: true,
          quantity: line?.quantity,
          message: res.body?.notice?.type === 'adjusted' ? res.body.notice.message : undefined,
        };
      };

      // ── public actions ─────────────────────────────────────────────────────

      return {
        items: [],
        source: 'guest',
        authed: false,
        totals: null,
        shippingState: null,
        pending: [],
        syncing: false,
        lastSyncedAt: null,
        notices: [],

        addItem: (input) =>
          enqueue(async () => {
            await whenAuthReady();
            const key = cartLineKey(input.productId, input.variantId);
            const qty = Math.max(1, Math.floor(input.quantity ?? 1));
            const existing = get().items.find((i) => i.key === key);
            const before = existing?.quantity ?? 0;

            // Already holding every available unit: say so without a round trip.
            if (
              existing &&
              existing.maxQty != null &&
              existing.availableQty != null &&
              before >= existing.maxQty &&
              existing.status !== 'out_of_stock'
            ) {
              return {
                ok: false,
                code: 'AT_MAX',
                quantity: before,
                message: `You already have all ${before} available in your cart.`,
              } satisfies ActionResult;
            }

            setPending(key, true);
            try {
              const result = get().authed
                ? await serverPut(input, qty, 'add')
                : await guestSetQuantity(input, Math.min(MAX_LINE_QTY, before + qty), existing);

              if (result.ok) {
                const after = result.quantity ?? before;
                const added = after - before;
                if (added <= 0) {
                  return {
                    ok: false,
                    code: 'AT_MAX',
                    quantity: after,
                    message: `You already have all ${after} available in your cart.`,
                  } satisfies ActionResult;
                }
                notify({
                  variant: result.message ? 'warning' : 'success',
                  title: result.message ? `Added ${added} to your cart` : 'Added to cart',
                  message: result.message ?? `${added} × ${input.name}`,
                });
              } else if (result.message) {
                notify({
                  variant: result.code === 'NETWORK' ? 'error' : 'warning',
                  title: result.code === 'NETWORK' ? 'No connection' : "Couldn't add to cart",
                  message: result.message,
                });
              }
              return result;
            } finally {
              setPending(key, false);
            }
          }),

        updateQty: (key, quantity) => {
          if (quantity <= 0) {
            return get()
              .removeItem(key)
              .then(() => ({ ok: true, quantity: 0 }) as ActionResult);
          }

          const current = get().items.find((i) => i.key === key);
          if (!current) return Promise.resolve({ ok: false, code: 'ERROR' } as ActionResult);

          const target = Math.min(MAX_LINE_QTY, Math.floor(quantity));

          // Cannot exceed what we last knew was available. Sync on open picks up restocks.
          if (current.maxQty != null && current.availableQty != null && target > current.maxQty) {
            return Promise.resolve({
              ok: false,
              code: 'AT_MAX',
              quantity: current.quantity,
              message: `Only ${current.maxQty} available.`,
            } as ActionResult);
          }

          // Lowering a quantity can never break stock rules, so show it immediately.
          const decreasing = target < current.quantity;
          if (decreasing) {
            set((s) => ({
              items: s.items.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      quantity: target,
                      status: i.status === 'adjusted' ? 'ok' : i.status,
                      message: i.status === 'adjusted' ? null : i.message,
                    }
                  : i
              ),
              totals: null,
            }));
          }

          return enqueue(async () => {
            await whenAuthReady();
            setPending(key, true);
            try {
              const result = get().authed
                ? await serverPut(current, target, 'set')
                : decreasing
                  ? ({ ok: true, quantity: target } as ActionResult)
                  : await guestSetQuantity(
                      {
                        productId: current.productId,
                        variantId: current.variantId,
                        name: current.name,
                        variantName: current.variantName,
                        price: current.price,
                        image: current.image,
                        slug: current.slug,
                        availabilityType: current.availabilityType,
                      },
                      target,
                      current
                    );

              if (!result.ok) {
                if (decreasing) void get().syncWithServer({ notify: false, force: true });
                if (result.message) {
                  notify({
                    variant: result.code === 'NETWORK' ? 'error' : 'warning',
                    title: result.code === 'NETWORK' ? 'No connection' : "Couldn't update quantity",
                    message: result.message,
                  });
                }
              } else if (result.message) {
                notify({ variant: 'warning', title: 'Quantity limited', message: result.message });
              }
              return result;
            } finally {
              setPending(key, false);
            }
          });
        },

        removeItem: (key) => {
          const current = get().items.find((i) => i.key === key);
          if (!current) return Promise.resolve();

          set((s) => ({ items: s.items.filter((i) => i.key !== key), totals: null }));

          return enqueue(async () => {
            await whenAuthReady();
            if (!get().authed) return;

            const res = current.itemId
              ? await api<{ snapshot?: CartSnapshot }>(
                  `/api/cart/items/${current.itemId}?state=${encodeURIComponent(get().shippingState ?? '')}`,
                  { method: 'DELETE' }
                )
              : await api<{ snapshot?: CartSnapshot }>('/api/cart/items', {
                  method: 'PUT',
                  body: JSON.stringify({
                    productId: current.productId,
                    variantId: current.variantId,
                    quantity: 0,
                    mode: 'set',
                    state: get().shippingState,
                  }),
                });

            if (res.status === 401) return sessionExpired();
            if (res.ok && res.body?.snapshot) return applySnapshot(res.body.snapshot, false);

            // Removal did not reach the server: restore the truth.
            notify({
              variant: 'error',
              title: "Couldn't remove item",
              message: 'Please check your connection and try again.',
            });
            await get().syncWithServer({ notify: false, force: true });
          });
        },

        clearCart: async () => {
          set({ items: [], totals: null });
          if (!get().authed) return;
          await enqueue(async () => {
            await api('/api/cart', { method: 'DELETE' });
          });
        },

        syncWithServer: (opts) =>
          enqueue(async () => {
            await whenAuthReady();
            const state = get();
            if (!opts?.force && state.lastSyncedAt && Date.now() - state.lastSyncedAt < 3000) {
              return true;
            }
            if (!state.authed && state.items.length === 0) return true;

            set({ syncing: true });
            try {
              if (state.authed) {
                const res = await api<CartSnapshot>(
                  `/api/cart?state=${encodeURIComponent(state.shippingState ?? '')}`
                );
                if (res.status === 401) {
                  sessionExpired();
                  return false;
                }
                if (!res.ok || !res.body) return false;
                applySnapshot(res.body, opts?.notify ?? true);
                return true;
              }

              const res = await validateGuest(
                state.items.map((i) => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.quantity,
                }))
              );
              if (!res.ok || !res.body) return false;
              applySnapshot(res.body, opts?.notify ?? true);
              return true;
            } finally {
              set({ syncing: false });
            }
          }),

        setShippingState: (state) => {
          if (get().shippingState !== state) set({ shippingState: state });
        },

        handleSignedIn: () =>
          runAuthStep(async () => {
            const state = get();
            set({ authed: true });

            // Normal page load while already signed in: just refresh.
            if (state.source === 'server') {
              set({ syncing: true });
              try {
                const res = await api<CartSnapshot>(
                  `/api/cart?state=${encodeURIComponent(state.shippingState ?? '')}`
                );
                if (res.status === 401) return sessionExpired();
                if (res.ok && res.body) applySnapshot(res.body, true);
              } finally {
                set({ syncing: false });
              }
              return;
            }

            // Just signed in with a guest cart: merge it into the server cart, once.
            set({ syncing: true });
            try {
              const guestLines = state.items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              }));

              if (guestLines.length > 0) {
                const res = await api<{ snapshot: CartSnapshot; report: MergeReport }>(
                  '/api/cart/merge',
                  {
                    method: 'POST',
                    body: JSON.stringify({ items: guestLines, state: state.shippingState }),
                  }
                );
                if (res.status === 401) return sessionExpired();
                if (res.ok && res.body) {
                  set({ source: 'server' });
                  applySnapshot(res.body.snapshot, false);
                  const { trimmed, skipped } = res.body.report;
                  for (const t of trimmed) {
                    notify({
                      variant: 'warning',
                      title: 'Quantity adjusted',
                      message: `Only ${t.kept} of ${t.name} are available, so we kept ${t.kept} in your cart.`,
                    });
                  }
                  for (const s of skipped) {
                    notify({
                      variant: 'warning',
                      title: 'Item not added',
                      message: `${s.name}: ${s.reason}`,
                    });
                  }
                  return;
                }
                // Merge failed (network). Keep the local lines and try again next time.
                notify({
                  variant: 'error',
                  title: "Couldn't load your saved cart",
                  message: NETWORK_MESSAGE,
                });
                return;
              }

              const res = await api<CartSnapshot>(
                `/api/cart?state=${encodeURIComponent(state.shippingState ?? '')}`
              );
              if (res.status === 401) return sessionExpired();
              if (res.ok && res.body) {
                set({ source: 'server' });
                applySnapshot(res.body, true);
              }
            } finally {
              set({ syncing: false });
            }
          }),

        handleSignedOut: () => {
          // A guest has no session on every page load. That must NOT wipe their cart.
          // Only a cart that belonged to a signed-in customer is cleared, so the next
          // person on a shared device never sees it.
          const wasCustomerCart = get().source === 'server' || get().authed;
          if (!wasCustomerCart) {
            set({ authed: false });
            return;
          }
          set({
            authed: false,
            source: 'guest',
            items: [],
            totals: null,
            pending: [],
            lastSyncedAt: null,
          });
        },

        dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

        itemCount: () =>
          get().items.reduce(
            (sum, i) => (countsTowardTotal(i.status ?? 'ok') ? sum + i.quantity : sum),
            0
          ),

        subtotal: () =>
          get().items.reduce(
            (sum, i) => (countsTowardTotal(i.status ?? 'ok') ? sum + i.price * i.quantity : sum),
            0
          ),

        isValid: () => {
          const { items } = get();
          return items.length > 0 && items.every((i) => isPurchasable(i.status ?? 'ok'));
        },

        issues: () => get().items.filter((i) => !isPurchasable(i.status ?? 'ok')),
      };
    },
    {
      name: 'bhoomi-cart',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Only what must survive a reload. Everything else is rebuilt from the server.
      partialize: (s) => ({ items: s.items, source: s.source, shippingState: s.shippingState }),
      migrate: (persisted) => {
        const old = persisted as { items?: CartItem[] } | undefined;
        return { items: old?.items ?? [], source: 'guest', shippingState: null } as never;
      },
    }
  )
);

// ─── Helper ──────────────────────────────────────────────────────────────────

export function cartItemKey(productId: string, variantId?: string | null): string {
  return cartLineKey(productId, variantId);
}
