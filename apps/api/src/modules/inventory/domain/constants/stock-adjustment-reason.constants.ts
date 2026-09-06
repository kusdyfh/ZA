/** Standard reason list for manual adjustments — docs/product/06-INVENTORY.md ("Manual Adjustments"). */
export const STOCK_ADJUSTMENT_REASON = {
  STOCKTAKE_CORRECTION: 'STOCKTAKE_CORRECTION',
  DAMAGED: 'DAMAGED',
  FOUND: 'FOUND',
  OTHER: 'OTHER',
} as const;

export type StockAdjustmentReasonValue =
  (typeof STOCK_ADJUSTMENT_REASON)[keyof typeof STOCK_ADJUSTMENT_REASON];
