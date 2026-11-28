/**
 * lib/store/cartUiStore.ts
 *
 * Whether the cart drawer is open. Lives in a store so any page (for example
 * the checkout page, when an item needs attention) can open it.
 */

import { create } from 'zustand';

interface CartUiState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartUiStore = create<CartUiState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
