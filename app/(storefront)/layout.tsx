/**
 * Storefront layout
 *
 * Wraps every public customer-facing page under app/(storefront)/.
 * Currently a passthrough shell — Navbar and Footer will be added in A1-T5
 * once those components are built.
 *
 * This layout does NOT replace app/layout.tsx (the root layout).
 * It sits beneath it, so it inherits fonts, globals.css, and <html>/<body>.
 *
 * Note: LayoutProps is globally available after `next dev` runs typegen.
 * No import needed — it is injected by the Next.js TypeScript plugin.
 */

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/*
        Navbar goes here in A1-T5.
        <Navbar />
      */}

      <main>{children}</main>

      {/*
        Footer goes here in A1-T5.
        <Footer />
      */}
    </>
  )
}
