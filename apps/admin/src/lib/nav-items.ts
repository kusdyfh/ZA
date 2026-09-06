import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  LayoutGrid,
  Award,
  Tags,
  Palette,
  Ruler,
  ShoppingCart,
  Warehouse,
  Users,
  Star,
  FileText,
  Bell,
  UserCog,
  ShieldCheck,
  KeyRound,
  Settings,
  MapPin,
  Truck,
  Package,
  Coins,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Grouped by DDD module per docs/09-DESIGN-SYSTEM.md §7 (Catalog /
 * Operations / Marketing / System). Every item is always rendered —
 * this app has no reliable way to know the logged-in admin's
 * permission set ahead of time (ADR 0019 §3), so per-page 403 handling
 * is the real access gate, not nav visibility.
 */
export const DASHBOARD_ITEM: NavItem = { label: 'Dashboard', href: '/', icon: LayoutDashboard };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Catalog',
    items: [
      { label: 'Products', href: '/products', icon: Shirt },
      { label: 'Categories', href: '/categories', icon: FolderTree },
      { label: 'Collections', href: '/collections', icon: LayoutGrid },
      { label: 'Brands', href: '/brands', icon: Award },
      { label: 'Tags', href: '/tags', icon: Tags },
      { label: 'Colors', href: '/colors', icon: Palette },
      { label: 'Sizes', href: '/sizes', icon: Ruler },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', href: '/orders', icon: ShoppingCart },
      { label: 'Inventory', href: '/inventory', icon: Warehouse },
      { label: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Reviews', href: '/reviews', icon: Star },
      { label: 'CMS', href: '/cms', icon: FileText },
    ],
  },
  {
    label: 'Shipping',
    items: [
      { label: 'Shipments', href: '/shipping/shipments', icon: Truck },
      { label: 'Zones', href: '/shipping/zones', icon: MapPin },
      { label: 'Methods', href: '/shipping/methods', icon: Package },
      { label: 'Rates', href: '/shipping/rates', icon: Coins },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Staff', href: '/staff', icon: UserCog },
      { label: 'Roles', href: '/roles', icon: ShieldCheck },
      { label: 'Permissions', href: '/permissions', icon: KeyRound },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((group) => group.items)];
