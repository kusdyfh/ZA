import type { ComponentType, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@za/shared';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /**
   * Defaults to a plain `<a>`. Pass the host app's own routing `Link`
   * (e.g. `next/link`) for real client-side navigation and prefetching
   * — `@za/ui` stays framework-agnostic, so it never imports `next`
   * itself.
   */
  linkComponent?: ComponentType<{ href: string; className?: string; children?: ReactNode }>;
}

export function Breadcrumbs({ items, className, linkComponent: LinkComponent }: BreadcrumbsProps) {
  const Anchor = LinkComponent ?? 'a';

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" aria-hidden="true" />}
              {item.href && !isLast ? (
                <Anchor href={item.href} className="text-neutral-500 hover:text-pink-700 dark:text-neutral-400 dark:hover:text-pink-300">
                  {item.label}
                </Anchor>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="font-medium text-neutral-900 dark:text-neutral-100">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
