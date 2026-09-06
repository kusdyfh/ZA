/** Plain TS union, not Prisma's generated `ProductRelationType` — same defensive-boundary pattern as PRODUCT_STATUS. */
export const PRODUCT_RELATION_TYPE = {
  RELATED: 'RELATED',
  CROSS_SELL: 'CROSS_SELL',
  UP_SELL: 'UP_SELL',
} as const;

export type ProductRelationTypeValue = (typeof PRODUCT_RELATION_TYPE)[keyof typeof PRODUCT_RELATION_TYPE];
