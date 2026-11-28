/**
 * lib/store/authModalStore.ts
 *
 * Controls the sign in / create account modal from anywhere:
 *
 *   useAuthModalStore.getState().open({
 *     reason: 'Sign in to continue with your checkout',
 *     redirectTo: '/checkout',
 *   });
 *
 * The cart is never touched by opening or closing the modal.
 */

import { create } from 'zustand';

export interface AuthModalOptions {
  /** Why we are asking, shown at the top of the modal */
  reason?: string;
  /** Where to go after a successful sign in. Omit to stay on the page. */
  redirectTo?: string;
  tab?: 'signin' | 'signup';
}

interface AuthModalState {
  isOpen: boolean;
  reason: string | null;
  redirectTo: string | null;
  tab: 'signin' | 'signup';
  /** The element that had focus when the modal was opened, so focus can go back to it. */
  opener: HTMLElement | null;
  open: (options?: AuthModalOptions) => void;
  close: () => void;
}

/** Only same-site paths are allowed as a redirect target. */
function safePath(path: string | undefined): string | null {
  if (!path) return null;
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : null;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  reason: null,
  redirectTo: null,
  tab: 'signin',
  opener: null,
  open: (options) =>
    set({
      opener:
        typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
      isOpen: true,
      reason: options?.reason ?? null,
      redirectTo: safePath(options?.redirectTo),
      tab: options?.tab ?? 'signin',
    }),
  close: () => set({ isOpen: false }),
}));
