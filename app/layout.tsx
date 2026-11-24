import type { Metadata } from 'next';
import { Playfair_Display, Lato } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
});

export const metadata: Metadata = {
  title: 'Bhoomi Art — The beauty of Mother Earth',
  description:
    'Handcrafted customized terracotta products — pots, sculptures, and artworks rooted in the beauty of Mother Earth.',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '192x192' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Bhoomi Art',
    description: 'The beauty of Mother Earth',
    images: ['/logo-icon.png'],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
