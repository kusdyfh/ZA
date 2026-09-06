'use client';

import Link from 'next/link';
import { Drawer } from '@za/ui';
import { NAV_ITEMS } from '@/lib/nav-items';
import { SearchBar } from './search-bar';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="end">
      <div className="flex flex-col gap-6">
        <SearchBar onSubmitted={onClose} />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-md px-3 py-2 text-base font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </Drawer>
  );
}
