import { Inject, Injectable } from '@nestjs/common';
import {
  VARIANT_STOCK_REPOSITORY,
  type VariantStockRepository,
} from '../../domain/repositories/variant-stock.repository';
import {
  STOCK_RESERVATION_REPOSITORY,
  type StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import type { VariantStock } from '../../domain/entities/variant-stock.entity';

export interface ListLowStockVariantsInput {
  warehouseId?: string;
}

export interface LowStockEntry {
  variantStock: VariantStock;
  available: number;
}

/**
 * "Low Stock Alerts" for this epoch is a queryable state, not a pushed
 * notification — Notifications infrastructure (docs/19-NOTIFICATIONS.md)
 * doesn't exist yet. A future Notifications epic calls this same
 * use-case on a schedule and turns its result into actual alerts; the
 * capability is real today, delivery is deferred.
 *
 * Checks every variant/warehouse row with a threshold set, computing
 * `available` for each — one query per row (N+1) rather than a single
 * aggregate query. Acceptable at this codebase's scale; revisit if it
 * ever becomes a real bottleneck.
 */
@Injectable()
export class ListLowStockVariantsUseCase {
  constructor(
    @Inject(VARIANT_STOCK_REPOSITORY) private readonly variantStocks: VariantStockRepository,
    @Inject(STOCK_RESERVATION_REPOSITORY) private readonly reservations: StockReservationRepository,
  ) {}

  async execute(input: ListLowStockVariantsInput = {}): Promise<LowStockEntry[]> {
    const candidates = await this.variantStocks.listWithThreshold(input.warehouseId);
    const results: LowStockEntry[] = [];

    for (const variantStock of candidates) {
      const activeReserved = await this.reservations.sumActiveQuantity(
        variantStock.variantId,
        variantStock.warehouseId,
      );
      const available = InventoryPolicy.computeAvailable(variantStock.quantity, activeReserved);
      if (InventoryPolicy.isLowStock(available, variantStock.lowStockThreshold)) {
        results.push({ variantStock, available });
      }
    }

    return results;
  }
}
