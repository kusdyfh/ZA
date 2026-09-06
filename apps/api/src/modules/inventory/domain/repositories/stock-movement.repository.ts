import type { StockMovement } from '../entities/stock-movement.entity';

export const STOCK_MOVEMENT_REPOSITORY = Symbol('STOCK_MOVEMENT_REPOSITORY');

/**
 * Read-only by design — the only way a `StockMovement` row is ever
 * created is `VariantStockRepository.applyMovement()`, never through
 * this port. See that repository's doc comment.
 */
export interface StockMovementRepository {
  listByVariant(variantId: string): Promise<StockMovement[]>;
}
