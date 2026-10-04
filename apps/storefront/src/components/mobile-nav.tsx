'use client';

import Link from 'next/link';
import { Drawer } from '@za/ui';
import { NAV_ITEMS } from '@/lib/nav-items';
import { SearchBar } from './search-bar';

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    // Matches SiteHeader's theme-aware brand skin (ADR 0029 §11) — the
    // header itself was already brand-tokened but this drawer's content
    // was left on the shared preset's plain neutral scale.
    <Drawer
      open={open}
      onClose={onClose}
      title="Menu"
      side="end"
      className="bg-brand-cream dark:bg-neutral-900"
      titleClassName="text-brand-ink dark:text-neutral-50"
    >
      <div className="flex flex-col gap-6">
        <SearchBar onSubmitted={onClose} />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-brand-md text-brand-ink hover:bg-brand-blush px-3 py-2 text-base font-medium dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </Drawer>
  );
}
