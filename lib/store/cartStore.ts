/**
 * lib/store/cartStore.ts
 *
 * Zustand cart store with localStorage persistence.
 *
 * Cart items are keyed by `${productId}::${variantId ?? 'base'}` so the
 * same product in different variants are treated as separate line items.
 *
 * Rules:
 * - `addItem` merges with an existing line by incrementing quantity.
 * - `updateQty(key, qty)` sets an absolute quantity; qty ≤ 0 removes the line.
 * - `removeItem(key)` deletes a specific line.
 * - `clearCart()` empties the entire cart.
 * - `itemCount` is the total number of units across all lines.
 * - `subtotal` is the sum of (price * quantity) for all lines.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  /** Composite key: `${productId}::${variantId ?? 'base'}` */
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number; // effective price (product.price + variant.price_modifier)
  quantity: number;
  image: string | null;
  slug: string;
  /** 'ready_to_ship' | 'made_to_order' — out_of_stock items are never added */
  availabilityType: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'key' | 'quantity'> & { quantity?: number }) => void;
  updateQty: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  /** Total number of units (sum of quantities) */
  itemCount: () => number;
  /** Sum of price × quantity for all lines */
  subtotal: () => number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (payload) => {
        const key = `${payload.productId}::${payload.variantId ?? 'base'}`;
        const qty = payload.quantity ?? 1;

        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...payload, key, quantity: qty }],
          };
        });
      },

      updateQty: (key, quantity) => {
        if (quantity <= 0) {
          set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
        } else {
          set((state) => ({
            items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
          }));
        }
      },

      removeItem: (key) => {
        set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'bhoomi-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ─── Helper ──────────────────────────────────────────────────────────────────

export function cartItemKey(productId: string, variantId?: string | null): string {
  return `${productId}::${variantId ?? 'base'}`;
}
