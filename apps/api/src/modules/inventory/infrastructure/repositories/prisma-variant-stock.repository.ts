import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { VariantStock } from '../../domain/entities/variant-stock.entity';
import type {
  ApplyStockMovementData,
  ApplyStockMovementResult,
  VariantStockRepository,
} from '../../domain/repositories/variant-stock.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import { VariantStockMapper } from '../mappers/variant-stock.mapper';
import { StockMovementMapper } from '../mappers/stock-movement.mapper';

interface LockedStockRow {
  id: string;
  quantity: number;
}

@Injectable()
export class PrismaVariantStockRepository implements VariantStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByVariantAndWarehouse(variantId: string, warehouseId: string): Promise<VariantStock | null> {
    const record = await this.prisma.variantStock.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
    return record ? VariantStockMapper.toDomain(record) : null;
  }

  async ensureExists(variantId: string, warehouseId: string): Promise<VariantStock> {
    const record = await this.prisma.variantStock.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      update: {},
      create: { variantId, warehouseId, quantity: 0 },
    });
    return VariantStockMapper.toDomain(record);
  }

  async listWithThreshold(warehouseId?: string): Promise<VariantStock[]> {
    const records = await this.prisma.variantStock.findMany({
      where: { lowStockThreshold: { not: null }, ...(warehouseId ? { warehouseId } : {}) },
    });
    return records.map(VariantStockMapper.toDomain);
  }

  async setLowStockThreshold(
    variantId: string,
    warehouseId: string,
    threshold: number | null,
  ): Promise<VariantStock> {
    const record = await this.prisma.variantStock.update({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      data: { lowStockThreshold: threshold },
    });
    return VariantStockMapper.toDomain(record);
  }

  /**
   * The only path that ever changes `VariantStock.quantity` — see this
   * port's doc comment and docs/v2/adr/0014. Locks the row (`SELECT ...
   * FOR UPDATE`), computes the new quantity via
   * `InventoryPolicy.computeStockDelta`, validates it never goes
   * negative, and writes the `StockMovement` row — all inside one
   * transaction, so a concurrent adjustment against the same row either
   * waits for this one to commit or (extremely briefly) blocks it, the
   * same locking discipline docs/v2/adr/0001 specifies for reservations.
   */
  async applyMovement(data: ApplyStockMovementData): Promise<ApplyStockMovementResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.variantStock.upsert({
        where: { variantId_warehouseId: { variantId: data.variantId, warehouseId: data.warehouseId } },
        update: {},
        create: { variantId: data.variantId, warehouseId: data.warehouseId, quantity: 0 },
      });

      const rows = await tx.$queryRaw<LockedStockRow[]>`
        SELECT "id", "quantity" FROM "variant_stocks"
        WHERE "variantId" = ${data.variantId} AND "warehouseId" = ${data.warehouseId}
        FOR UPDATE
      `;
      const current = rows[0];
      if (!current) {
        throw new Error(
          `VariantStock row for variant "${data.variantId}" / warehouse "${data.warehouseId}" vanished mid-transaction.`,
        );
      }

      const delta = InventoryPolicy.computeStockDelta(data.type, data.quantity);
      const resultingStock = current.quantity + delta;
      InventoryPolicy.assertNonNegativeResultingStock(resultingStock);

      const updatedRecord = await tx.variantStock.update({
        where: { id: current.id },
        data: { quantity: resultingStock },
      });

      const movementRecord = await tx.stockMovement.create({
        data: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          type: data.type,
          quantity: data.quantity,
          resultingStock,
          reason: data.reason ?? null,
          note: data.note ?? null,
          actorId: data.actor.actorId,
          actorType: data.actor.actorType,
        },
      });

      return {
        variantStock: VariantStockMapper.toDomain(updatedRecord),
        movement: StockMovementMapper.toDomain(movementRecord),
      };
    });
  }
}
