import type { Metadata } from 'next';
import { Caveat, Fraunces, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartDrawer } from '@/features/cart/components/cart-drawer';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

/** ADR 0029 §3 — Nunito Sans replaces Inter as the storefront body/UI font: a warm humanist sans, explicitly chosen over Inter's "every SaaS product" default. */
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  // next/font's built-in fallback-metrics table (used to auto-tune a
  // matching system-font fallback to avoid layout shift) doesn't carry an
  // entry for this family in the Next.js version this app pins — without
  // this flag the production build fails outright (`Failed to find font
  // override values for font 'Nunito Sans'`).
  adjustFontFallback: false,
});

/** ADR 0029 §3 (carried over from ADR 0028 §3) — hand-written accent font for signage-style labels, sticker text, and pull-quotes only. Never body copy. */
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
      className={`${fraunces.variable} ${nunitoSans.variable} ${caveat.variable}`}
      // The storefront is light-only: the ZA illustrated world has no dark
      // palette, so the theme is fixed rather than read from the OS or storage.
      data-theme="light"
    >
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
