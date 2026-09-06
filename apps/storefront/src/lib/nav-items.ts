export interface NavItem {
  label: string;
  href: string;
}

/** Primary storefront nav — generic routes, not hardcoded to specific category/collection names (no business logic in the frontend). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Collections', href: '/collections' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
