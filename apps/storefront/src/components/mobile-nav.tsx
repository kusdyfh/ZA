'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer } from '@za/ui';
import { cn } from '@za/shared';
import { NAV_ITEMS } from '@/lib/nav-items';
import { SearchBar } from './search-bar';

/** The site menu — opened from the header's left-hand menu button on every screen size. */
export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Menu"
      side="start"
      className="bg-brand-cream"
      titleClassName="text-brand-ink"
    >
      <div className="flex flex-col gap-6">
        <SearchBar onSubmitted={onClose} />
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-brand-md text-brand-ink hover:bg-brand-blush px-3 py-2 text-base font-medium',
                  isActive && 'bg-brand-blush text-brand-plum',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </Drawer>
  );
}
