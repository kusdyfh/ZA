import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/nav-items';
import { Logo } from '@/components/brand';

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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-brand-ink text-sm font-semibold dark:text-neutral-100">
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-brand-mauve hover:text-brand-plum text-sm dark:text-neutral-400 dark:hover:text-pink-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ADR 0029 §11 — global chrome shared with pages outside this rollout's
// redesign, so it stays theme-aware (brand tokens for light mode, the
// pre-existing neutral dark palette for dark mode) rather than the
// homepage's fixed always-light surface.
export function SiteFooter() {
  return (
    <footer className="border-brand-petal-100 bg-brand-cream border-t dark:border-neutral-800 dark:bg-transparent">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Logo variant="wordmark" tone="auto" />
          <p className="text-brand-mauve mt-3 max-w-xs text-sm dark:text-neutral-400">
            Premium medical scrubs, lab coats, and accessories — soft, modern,
            and made for long shifts.
          </p>
        </div>
        <FooterColumn
          title="Shop"
          links={NAV_ITEMS.filter(
            (item) => item.href !== '/about' && item.href !== '/contact',
          )}
        />
        <FooterColumn title="Support" links={SUPPORT_LINKS} />
        <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>
      <div className="border-brand-petal-100 text-brand-mauve border-t px-4 py-6 text-center text-sm sm:px-6 dark:border-neutral-800 dark:text-neutral-400">
        © {new Date().getFullYear()} ZA Store. All rights reserved.
      </div>
    </footer>
  );
}
