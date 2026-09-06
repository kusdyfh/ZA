import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/nav-items';

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Track your order', href: '/track-order' },
];

const ACCOUNT_LINKS = [
  { label: 'Sign in', href: '/login' },
  { label: 'Create account', href: '/register' },
  { label: 'Wishlist', href: '/account/wishlist' },
];

const LEGAL_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-brand-ink dark:text-neutral-100">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-brand-ink-muted hover:text-brand-blush-600 dark:text-neutral-400 dark:hover:text-pink-300">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ADR 0028 §6 — global chrome shared with pages outside this epic's
// redesign, so it stays theme-aware (brand tokens for light mode, the
// pre-existing neutral dark palette for dark mode) rather than the
// homepage's fixed always-light surface.
export function SiteFooter() {
  return (
    <footer className="border-t border-brand-blush-100 bg-brand-cream-50 dark:border-neutral-800 dark:bg-transparent">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-xl font-semibold text-brand-blush-600 dark:text-pink-300">ZA Store</span>
          <p className="mt-3 max-w-xs text-sm text-brand-ink-muted dark:text-neutral-400">
            Premium medical scrubs, lab coats, and accessories — soft, modern, and made for long shifts.
          </p>
        </div>
        <FooterColumn title="Shop" links={NAV_ITEMS.filter((item) => item.href !== '/about' && item.href !== '/contact')} />
        <FooterColumn title="Support" links={SUPPORT_LINKS} />
        <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>
      <div className="border-t border-brand-blush-100 px-4 py-6 text-center text-sm text-brand-ink-muted dark:border-neutral-800 dark:text-neutral-400 sm:px-6">
        © {new Date().getFullYear()} ZA Store. All rights reserved.
      </div>
    </footer>
  );
}
