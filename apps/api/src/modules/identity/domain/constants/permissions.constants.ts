import { ROLE_KEYS, type RoleKey } from './roles.constants';

/**
 * Every grantable capability, keyed `<module>.<action>`. This is the
 * single source of truth consumed by both prisma/seed.ts and the
 * application layer — see
 * docs/epics/EPIC-02-COMPLETION-REPORT.md for the mapping of each key
 * back to docs/05-ROADMAP.md's RBAC matrix, including the handful of
 * disclosed simplifications (e.g. "packing view" and "inventory KPIs
 * only" aren't modeled as separately scoped permissions in this epic).
 */
export const PERMISSION_KEYS = {
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  ORDERS_VIEW: 'orders.view',
  ORDERS_FULFILL: 'orders.fulfill',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_NOTES: 'orders.notes',
  CUSTOMERS_VIEW: 'customers.view',
  COUPONS_VIEW: 'coupons.view',
  COUPONS_MANAGE: 'coupons.manage',
  REVIEWS_MODERATE: 'reviews.moderate',
  CONTENT_MANAGE: 'content.manage',
  ANALYTICS_VIEW: 'analytics.view',
  USERS_MANAGE: 'users.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_LOG_VIEW: 'audit_log.view',
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export interface PermissionDefinition {
  key: PermissionKey;
  module: string;
  action: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: PERMISSION_KEYS.PRODUCTS_VIEW,
    module: 'products',
    action: 'view',
    description: 'View products, categories, and collections.',
  },
  {
    key: PERMISSION_KEYS.PRODUCTS_MANAGE,
    module: 'products',
    action: 'manage',
    description: 'Create, edit, and archive products, categories, and collections.',
  },
  {
    key: PERMISSION_KEYS.INVENTORY_VIEW,
    module: 'inventory',
    action: 'view',
    description: 'View stock levels and movement history.',
  },
  {
    key: PERMISSION_KEYS.INVENTORY_ADJUST,
    module: 'inventory',
    action: 'adjust',
    description: 'Record manual stock adjustments and receive stock.',
  },
  {
    key: PERMISSION_KEYS.ORDERS_VIEW,
    module: 'orders',
    action: 'view',
    description: 'View orders and their status history.',
  },
  {
    key: PERMISSION_KEYS.ORDERS_FULFILL,
    module: 'orders',
    action: 'fulfill',
    description: 'Change order status through preparation, packing, and shipping.',
  },
  {
    key: PERMISSION_KEYS.ORDERS_REFUND,
    module: 'orders',
    action: 'refund',
    description: 'Cancel orders and issue refunds.',
  },
  {
    key: PERMISSION_KEYS.ORDERS_NOTES,
    module: 'orders',
    action: 'notes',
    description: 'Add internal or customer-visible notes to an order.',
  },
  {
    key: PERMISSION_KEYS.CUSTOMERS_VIEW,
    module: 'customers',
    action: 'view',
    description: 'View customer profiles and order history.',
  },
  {
    key: PERMISSION_KEYS.COUPONS_VIEW,
    module: 'coupons',
    action: 'view',
    description: 'View and apply coupons.',
  },
  {
    key: PERMISSION_KEYS.COUPONS_MANAGE,
    module: 'coupons',
    action: 'manage',
    description: 'Create, edit, and deactivate coupons.',
  },
  {
    key: PERMISSION_KEYS.REVIEWS_MODERATE,
    module: 'reviews',
    action: 'moderate',
    description: 'Approve or reject customer reviews.',
  },
  {
    key: PERMISSION_KEYS.CONTENT_MANAGE,
    module: 'content',
    action: 'manage',
    description: 'Manage the homepage, banners, blog, and static pages.',
  },
  {
    key: PERMISSION_KEYS.ANALYTICS_VIEW,
    module: 'analytics',
    action: 'view',
    description: 'View the analytics dashboard.',
  },
  {
    key: PERMISSION_KEYS.USERS_MANAGE,
    module: 'users',
    action: 'manage',
    description: 'Create staff accounts and assign roles.',
  },
  {
    key: PERMISSION_KEYS.SETTINGS_MANAGE,
    module: 'settings',
    action: 'manage',
    description: 'Change store-wide settings.',
  },
  {
    key: PERMISSION_KEYS.AUDIT_LOG_VIEW,
    module: 'audit_log',
    action: 'view',
    description: 'View the audit log.',
  },
];

export interface RoleDefinition {
  key: RoleKey;
  name: string;
  description: string;
  permissions: PermissionKey[];
}

export const ROLE_DEFINITIONS: Record<RoleKey, RoleDefinition> = {
  [ROLE_KEYS.SUPER_ADMIN]: {
    key: ROLE_KEYS.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full access to every module, including staff and settings.',
    permissions: Object.values(PERMISSION_KEYS),
  },
  [ROLE_KEYS.MANAGER]: {
    key: ROLE_KEYS.MANAGER,
    name: 'Manager',
    description: 'Runs day-to-day merchandising and operations.',
    permissions: [
      PERMISSION_KEYS.PRODUCTS_VIEW,
      PERMISSION_KEYS.PRODUCTS_MANAGE,
      PERMISSION_KEYS.INVENTORY_VIEW,
      PERMISSION_KEYS.ORDERS_VIEW,
      PERMISSION_KEYS.ORDERS_FULFILL,
      PERMISSION_KEYS.ORDERS_REFUND,
      PERMISSION_KEYS.ORDERS_NOTES,
      PERMISSION_KEYS.CUSTOMERS_VIEW,
      PERMISSION_KEYS.COUPONS_VIEW,
      PERMISSION_KEYS.COUPONS_MANAGE,
      PERMISSION_KEYS.REVIEWS_MODERATE,
      PERMISSION_KEYS.CONTENT_MANAGE,
      PERMISSION_KEYS.ANALYTICS_VIEW,
      PERMISSION_KEYS.AUDIT_LOG_VIEW,
    ],
  },
  [ROLE_KEYS.WAREHOUSE]: {
    key: ROLE_KEYS.WAREHOUSE,
    name: 'Warehouse',
    description: 'Owns physical stock reality — inventory, packing, shipping status.',
    permissions: [
      PERMISSION_KEYS.PRODUCTS_VIEW,
      PERMISSION_KEYS.INVENTORY_VIEW,
      PERMISSION_KEYS.INVENTORY_ADJUST,
      PERMISSION_KEYS.ORDERS_VIEW,
      PERMISSION_KEYS.ORDERS_FULFILL,
      PERMISSION_KEYS.ANALYTICS_VIEW,
    ],
  },
  [ROLE_KEYS.SALES]: {
    key: ROLE_KEYS.SALES,
    name: 'Sales',
    description: 'Owns the customer-facing sales relationship.',
    permissions: [
      PERMISSION_KEYS.PRODUCTS_VIEW,
      PERMISSION_KEYS.ORDERS_VIEW,
      PERMISSION_KEYS.ORDERS_FULFILL,
      PERMISSION_KEYS.ORDERS_NOTES,
      PERMISSION_KEYS.CUSTOMERS_VIEW,
      PERMISSION_KEYS.COUPONS_VIEW,
      PERMISSION_KEYS.ANALYTICS_VIEW,
    ],
  },
  [ROLE_KEYS.CUSTOMER_SUPPORT]: {
    key: ROLE_KEYS.CUSTOMER_SUPPORT,
    name: 'Customer Support',
    description: 'Owns post-purchase customer care.',
    permissions: [
      PERMISSION_KEYS.PRODUCTS_VIEW,
      PERMISSION_KEYS.ORDERS_VIEW,
      PERMISSION_KEYS.ORDERS_NOTES,
      PERMISSION_KEYS.CUSTOMERS_VIEW,
      PERMISSION_KEYS.REVIEWS_MODERATE,
    ],
  },
};
