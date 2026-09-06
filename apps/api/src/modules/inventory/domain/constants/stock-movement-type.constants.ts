/** Plain TS union, not Prisma's generated `StockMovementType` — same defensive-boundary pattern used throughout Catalog. */
export const STOCK_MOVEMENT_TYPE = {
  RECEIVE: 'RECEIVE',
  SALE: 'SALE',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN',
  DAMAGED: 'DAMAGED',
} as const;

export type StockMovementTypeValue = (typeof STOCK_MOVEMENT_TYPE)[keyof typeof STOCK_MOVEMENT_TYPE];
