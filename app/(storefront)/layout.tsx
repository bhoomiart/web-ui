/**
 * Storefront layout
 *
 * Wraps every public customer-facing page under app/(storefront)/.
 * Provides Navbar (sticky top), Footer, and ToastProvider for cart/order actions.
 */

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import { CartSync } from '@/components/storefront/CartSync';
import { AuthModal } from '@/components/auth/AuthModal';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartSync />
      <AuthModal />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </ToastProvider>
  );
}
