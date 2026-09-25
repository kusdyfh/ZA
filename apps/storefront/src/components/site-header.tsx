'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@za/ui';
import { cn } from '@za/shared';
import { NAV_ITEMS } from '@/lib/nav-items';
import { Logo } from '@/components/brand';
import { SearchBar } from './search-bar';
import { CartIconButton } from './cart-icon-button';
import { WishlistIconButton } from './wishlist-icon-button';
import { AccountIconButton } from './account-icon-button';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    // ADR 0029 §11 — the header is global chrome shared with pages outside
    // this rollout's redesign (cart, checkout, account) that keep full
    // dark-mode support, so unlike the homepage it stays theme-aware:
    // brand tokens for light mode, the pre-existing neutral dark palette
    // for dark mode, rather than a fixed always-light surface.
    <header className="border-brand-petal-100 bg-brand-cream/95 sticky top-0 z-30 border-b backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setIsMobileNavOpen(true)}
          className="text-brand-ink hover:bg-brand-blush rounded-md p-1.5 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link href="/" aria-label="ZA Store, home" className="shrink-0">
          <Logo variant="wordmark" tone="auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-brand-ink hover:text-brand-plum text-sm font-semibold dark:text-neutral-200 dark:hover:text-pink-300',
                  isActive && 'text-brand-plum dark:text-pink-300',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchBar className="hidden w-56 lg:block" />
          <ThemeToggle />
          <AccountIconButton />
          <WishlistIconButton />
          <CartIconButton />
        </div>
      </div>

      <MobileNav
        open={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </header>
  );
}
