'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@za/ui';
import { ALL_NAV_ITEMS } from '@/lib/nav-items';
import { useAuth } from '@/lib/auth/auth-context';

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const { adminUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const title =
    ALL_NAV_ITEMS.find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`))?.label ??
    'ZA Store Admin';

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenMobileNav}
          className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* Not a heading — each page's own PageHeader renders the real <h1>. Two
            <h1>s per page is both an a11y anti-pattern and, in practice, made
            every `getByRole('heading', { name })` query in the E2E suite
            ambiguous against this identical-text breadcrumb label. */}
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <UserCircle className="h-5 w-5" aria-hidden="true" />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute end-0 z-20 mt-2 w-56 rounded-md border border-neutral-200 bg-white p-2 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                {adminUser && (
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {adminUser.name}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{adminUser.email}</p>
                  </div>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void logout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
