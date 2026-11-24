/**
 * Storefront layout
 *
 * Wraps every public customer-facing page under app/(storefront)/.
 * Provides Navbar (sticky top) and Footer.
 *
 * ToastProvider will be added here in A6 when cart/order actions need toasts.
 */

import { Footer } from '@/components/layout/Footer'
import { Navbar }  from '@/components/layout/Navbar'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
