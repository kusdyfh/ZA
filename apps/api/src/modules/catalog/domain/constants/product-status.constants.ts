/**
 * A plain TS union, deliberately not Prisma's generated `ProductStatus`
 * type — same defensive-boundary pattern as Epic 2's `ROLE_KEYS`
 * (see identity/domain/constants/roles.constants.ts): the domain layer
 * never couples directly to a generated infrastructure type.
 */
export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProductStatusValue = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
