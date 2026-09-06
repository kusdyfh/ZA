import { Inject, Injectable } from '@nestjs/common';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import {
  STOCK_MOVEMENT_REPOSITORY,
  type StockMovementRepository,
} from '../../domain/repositories/stock-movement.repository';

export interface ListStockMovementsInput {
  variantId: string;
}

/** The full, permanent, per-variant movement history — docs/product/06-INVENTORY.md "Audit Trail". */
@Injectable()
export class ListStockMovementsUseCase {
  constructor(
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movements: StockMovementRepository,
  ) {}

  execute(input: ListStockMovementsInput): Promise<StockMovement[]> {
    return this.movements.listByVariant(input.variantId);
  }
}
