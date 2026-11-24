/**
 * Admin layout
 *
 * Wraps every admin page under app/(admin)/.
 * Currently a passthrough shell — AdminSidebar and AdminTopbar
 * will be added in A1-T6 once those components are built.
 *
 * Route protection (proxy.ts) will be added in A3-T1.
 *
 * This layout does NOT replace app/layout.tsx (the root layout).
 * It sits beneath it, so it inherits fonts, globals.css, and <html>/<body>.
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[var(--color-earth-50)]">
      {/*
        AdminSidebar goes here in A1-T6.
        <AdminSidebar />
      */}

      <div className="flex flex-1 flex-col min-w-0">
        {/*
          AdminTopbar goes here in A1-T6.
          <AdminTopbar />
        */}

        <main className="flex-1 p-[var(--spacing-6)]">
          {children}
        </main>
      </div>
    </div>
  )
}
