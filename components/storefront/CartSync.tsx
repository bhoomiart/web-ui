'use client';

/**
 * CartSync
 *
 * Mounted once in the storefront layout. It renders nothing. It:
 *   1. Tells the cart store whether a customer is signed in, and triggers the
 *      one-time guest-cart merge on sign-in.
 *   2. Re-checks the cart when the tab regains focus, so a cart edited on
 *      another device, or stock that changed meanwhile, is picked up.
 *   3. Turns cart notices (price changed, quantity reduced, sold out, added)
 *      into toasts.
 */

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { markCartAuthReady, useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useToast } from '@/components/ui/Toast';

const FOCUS_SYNC_MIN_GAP_MS = 20_000;

export function CartSync() {
  const toast = useToast();
  const notices = useCartStore((s) => s.notices);
  const dismissNotice = useCartStore((s) => s.dismissNotice);

  // 1. Auth state
  React.useEffect(() => {
    const supabase = createClient();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Do not call Supabase or await inside this callback. Defer instead.
      setTimeout(() => {
        const store = useCartStore.getState();
        const user = session?.user;
        const confirmed = Boolean(user && (user.email_confirmed_at || user.phone_confirmed_at));

        // Publish who is signed in for the navbar and forms.
        const meta = (user?.user_metadata ?? {}) as { full_name?: string };
        useAuthStore
          .getState()
          .setUser(
            user && confirmed
              ? { id: user.id, email: user.email ?? null, name: meta.full_name ?? null, role: null }
              : null
          );

        // Staff and admins get a link to the admin area, so read the role (own row only, via RLS).
        if (user && confirmed) {
          void supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => useAuthStore.getState().setRole(data?.role ?? null));
        }

        if (event === 'SIGNED_OUT' || !confirmed) {
          // INITIAL_SESSION with no session also lands here, which clears a cart
          // left behind by a previous customer on this device.
          store.handleSignedOut();
          markCartAuthReady();
          return;
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          void store.handleSignedIn().finally(markCartAuthReady);
        }
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // 2. Re-check on focus
  React.useEffect(() => {
    let last = Date.now();
    function check() {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < FOCUS_SYNC_MIN_GAP_MS) return;
      last = Date.now();
      void useCartStore.getState().syncWithServer({ notify: true });
    }
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  // 3. Notices -> toasts
  React.useEffect(() => {
    if (notices.length === 0) return;
    for (const n of notices) {
      toast.add({
        variant: n.variant,
        title: n.title,
        message: n.message,
        duration: n.variant === 'warning' || n.variant === 'error' ? 6000 : 3500,
      });
      dismissNotice(n.id);
    }
  }, [notices, toast, dismissNotice]);

  return null;
}
