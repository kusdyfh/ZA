import Link from 'next/link';
import type { ReactNode } from 'react';

/** Adapts `next/link` to the plain `{href, className, children}` shape `@za/ui`'s `Breadcrumbs` expects (its `href` is typed as `string`, Next's as `Url`). */
export function BreadcrumbLink({ href, className, children }: { href: string; className?: string; children?: ReactNode }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
