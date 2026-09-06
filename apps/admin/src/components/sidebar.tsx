'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@za/shared';
import { DASHBOARD_ITEM, NAV_GROUPS } from '@/lib/nav-items';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavLink({ href, label, Icon, isActive, onClick }: {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md border-s-2 border-transparent px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
        isActive &&
          'border-pink-500 bg-pink-50 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center px-6 font-display text-lg font-semibold text-pink-700 dark:text-pink-300">
        ZA Store
      </div>
      <nav className="flex flex-col gap-4 px-3 pb-6">
        <NavLink
          href={DASHBOARD_ITEM.href}
          label={DASHBOARD_ITEM.label}
          Icon={DASHBOARD_ITEM.icon}
          isActive={pathname === DASHBOARD_ITEM.href}
          onClick={onNavigate}
        />
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-e border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="relative z-10 h-full w-64 overflow-y-auto bg-white dark:bg-neutral-900">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                aria-label="Close menu"
                onClick={onCloseMobile}
                className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
