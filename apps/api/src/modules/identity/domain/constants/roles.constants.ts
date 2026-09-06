/**
 * The five fixed roles from docs/05-ROADMAP.md's RBAC permission matrix.
 * `key` is the stable machine identifier stored in Role.key — see
 * docs/v2/adr/0011-data-driven-rbac-schema.md for why these are seeded
 * rows rather than a hardcoded enum. Custom, non-system roles are a
 * future extension (docs/v2/12-OPEN-QUESTIONS.md), not built here.
 */
export const ROLE_KEYS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
  SALES: 'SALES',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];
