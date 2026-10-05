'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand';
import { CartIconButton } from './cart-icon-button';
import { AccountIconButton } from './account-icon-button';
import { MenuIcon } from './menu-icon';
import { MobileNav } from './mobile-nav';

/**
 * The header shares the hero's cream + monogram pattern surface and a dashed
 * petal hairline (the identity book's dashed-frame motif), so it reads as the
 * top edge of the illustrated page rather than a separate bar. Light-only —
 * the storefront has no dark palette (see the root layout).
 *
 * Three controls only: the menu (which holds the navigation and search),
 * account, and the bag.
 */
export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="brand-pattern-low border-brand-petal-300/70 sticky top-0 z-30 border-b border-dashed">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:h-16 sm:px-6">
        <div className="flex justify-start">
          <button
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            className="text-brand-plum hover:bg-brand-petal-100 focus-visible:shadow-focus inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        <Link
          href="/"
          aria-label="ZA Store, home"
          className="focus-visible:shadow-focus rounded-md focus-visible:outline-none"
        >
          <Logo variant="wordmark" className="h-11 sm:h-12" />
        </Link>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <AccountIconButton />
          <CartIconButton />
        </div>
      </div>

      <MobileNav open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
