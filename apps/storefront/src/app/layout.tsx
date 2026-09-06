import type { Metadata } from 'next';
import { Caveat, Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { ThemeInitScript } from '@za/ui';
import { Providers } from '@/lib/providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartDrawer } from '@/features/cart/components/cart-drawer';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/** Epic 13 (ADR 0028 §3) — hand-written accent font for signage-style labels, sticker text, and pull-quotes only. Never body copy. */
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
});

/**
 * The root layout sets the site-wide title template every other page's
 * `generateMetadata()` (via `lib/seo.ts`'s `buildMetadata`) inherits —
 * that helper only ever supplies a plain resolved title, never the
 * template itself (ADR 0022 §7).
 */
export const metadata: Metadata = {
  title: { default: 'ZA Store', template: '%s | ZA Store' },
  description:
    'Premium medical scrubs, lab coats, and accessories — soft, modern, and made for long shifts.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
