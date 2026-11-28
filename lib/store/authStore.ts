/**
 * lib/store/authStore.ts
 *
 * Who is signed in, as far as the browser knows. Filled by <CartSync>, which
 * listens to Supabase auth events. This is for display only (account button,
 * pre-fill). Every server route re-checks the session itself.
 */

import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  /** 'admin' | 'staff' | 'customer'. null until the profile has been read. */
  role: string | null;
}

interface AuthState {
  user: AuthUser | null;
  /** False until Supabase has told us whether a session exists */
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  setRole: (role: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
  setRole: (role) => set((s) => (s.user ? { user: { ...s.user, role } } : s)),
}));
