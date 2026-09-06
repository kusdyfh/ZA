import type { ActorRef } from '@za/types';
import type { VariantStock } from '../entities/variant-stock.entity';
import type { StockMovement } from '../entities/stock-movement.entity';
import type { StockMovementTypeValue } from '../constants/stock-movement-type.constants';
import type { StockAdjustmentReasonValue } from '../constants/stock-adjustment-reason.constants';

export const VARIANT_STOCK_REPOSITORY = Symbol('VARIANT_STOCK_REPOSITORY');

export interface ApplyStockMovementData {
  variantId: string;
  warehouseId: string;
  type: StockMovementTypeValue;
  /** Signed delta actually applied to VariantStock.quantity — 0 for DAMAGED (see schema.prisma's StockMovement doc comment). */
  quantity: number;
  reason?: StockAdjustmentReasonValue | null;
  note?: string | null;
  actor: ActorRef;
}

export interface ApplyStockMovementResult {
  variantStock: VariantStock;
  movement: StockMovement;
}

/**
 * `applyMovement` is the *only* way `quantity` on a `VariantStock` row
 * ever changes — it locks the row, computes and validates the new
 * quantity (via `InventoryPolicy`), and writes the `StockMovement` row
 * in the same transaction. See docs/v2/adr/0014 and
 * docs/product/06-INVENTORY.md's audit-trail requirement.
 */
export interface VariantStockRepository {
  findByVariantAndWarehouse(variantId: string, warehouseId: string): Promise<VariantStock | null>;
  /** Creates a zero-quantity row if none exists yet — used before the first movement against a variant/warehouse pair. */
  ensureExists(variantId: string, warehouseId: string): Promise<VariantStock>;
  /** Every row with a threshold set, for the given warehouse (or all warehouses if omitted) — callers compute `available` themselves via reservations. */
  listWithThreshold(warehouseId?: string): Promise<VariantStock[]>;
  setLowStockThreshold(variantId: string, warehouseId: string, threshold: number | null): Promise<VariantStock>;
  applyMovement(data: ApplyStockMovementData): Promise<ApplyStockMovementResult>;
}
