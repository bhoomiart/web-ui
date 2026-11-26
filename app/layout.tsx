import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Lato } from 'next/font/google';
import './globals.css';
import { Analytics } from '@/components/Analytics';

export const instant = false;

// ─── Fonts (A8-T3-3) ─────────────────────────────────────────────────────────
// display: 'swap' ensures text is visible during font load.
// Only the weights actually used are included to minimise bundle size.

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
});

// ─── Viewport (A8-T3-4) ──────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#b65e3c',
};

// ─── Default metadata ─────────────────────────────────────────────────────────
// Individual pages override these via their own generateMetadata.

export async function generateMetadata(): Promise<Metadata> {
  // Fetch GSC verification code from site_settings
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['gsc_verification']);

  const gscVerification = data?.find((r) => r.key === 'gsc_verification')?.value ?? null;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bhoomiart.com'),
    title: {
      default: 'Bhoomi Art — Handcrafted Terracotta',
      template: '%s — Bhoomi Art',
    },
    description:
      'Discover handcrafted terracotta pottery and earthenware by Bhoomi Art — rooted in earth, shaped by hand.',
    icons: {
      icon: [{ url: '/icon.png', type: 'image/png', sizes: '192x192' }],
      shortcut: '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      siteName: 'Bhoomi Art',
      title: 'Bhoomi Art — Handcrafted Terracotta',
      description:
        'Handcrafted terracotta pottery and earthenware — rooted in earth, shaped by hand.',
      images: [{ url: '/logo-icon.png', width: 512, height: 512, alt: 'Bhoomi Art logo' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Bhoomi Art',
      description: 'Handcrafted terracotta pottery and earthenware.',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    // A8-T5-3: GSC verification meta tag
    ...(gscVerification ? { verification: { google: gscVerification } } : {}),
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Analytics scripts — afterInteractive, non-blocking */}
        <Analytics />
      </body>
    </html>
  );
}
