import { Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { StockReservation } from '../../domain/entities/stock-reservation.entity';
import type {
  CreateReservationData,
  StockReservationRepository,
} from '../../domain/repositories/stock-reservation.repository';
import { InventoryPolicy } from '../../domain/policies/inventory-policy';
import { STOCK_MOVEMENT_TYPE } from '../../domain/constants/stock-movement-type.constants';
import { STOCK_RESERVATION_STATUS } from '../../domain/constants/stock-reservation-status.constants';
import { StockReservationNotFoundError } from '../../domain/errors/inventory.errors';
import { StockReservationMapper } from '../mappers/stock-reservation.mapper';

@Injectable()
export class PrismaStockReservationRepository implements StockReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Per docs/v2/adr/0001 §"Creation": lock the VariantStock row, verify
   * available() >= quantity, insert the reservation, commit — held for
   * the milliseconds of this check-and-insert only, never across a
   * payment call.
   */
  async createIfAvailable(data: CreateReservationData): Promise<StockReservation> {
    return this.prisma.$transaction(async (tx) => {
      await tx.variantStock.upsert({
        where: { variantId_warehouseId: { variantId: data.variantId, warehouseId: data.warehouseId } },
        update: {},
        create: { variantId: data.variantId, warehouseId: data.warehouseId, quantity: 0 },
      });

      const stockRows = await tx.$queryRaw<{ quantity: number }[]>`
        SELECT "quantity" FROM "variant_stocks"
        WHERE "variantId" = ${data.variantId} AND "warehouseId" = ${data.warehouseId}
        FOR UPDATE
      `;
      const stockQuantity = stockRows[0]?.quantity ?? 0;

      const activeReservedResult = await tx.stockReservation.aggregate({
        where: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          status: STOCK_RESERVATION_STATUS.ACTIVE,
        },
        _sum: { quantity: true },
      });
      const activeReserved = activeReservedResult._sum.quantity ?? 0;

      const available = InventoryPolicy.computeAvailable(stockQuantity, activeReserved);
      InventoryPolicy.assertSufficientAvailableStock(available, data.quantity);

      const createdAt = new Date();
      const expiresAt = InventoryPolicy.computeExpiresAt(createdAt, data.ttlMinutes);

      const record = await tx.stockReservation.create({
        data: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
          cartId: data.cartId,
          quantity: data.quantity,
          status: STOCK_RESERVATION_STATUS.ACTIVE,
          expiresAt,
        },
      });

      return StockReservationMapper.toDomain(record);
    });
  }

  async findById(id: string): Promise<StockReservation | null> {
    const record = await this.prisma.stockReservation.findUnique({ where: { id } });
    return record ? StockReservationMapper.toDomain(record) : null;
  }

  /**
   * ACTIVE -> CONFIRMED, decrementing stock and writing a SALE movement
   * in the same transaction. Locks the reservation row first (so two
   * concurrent confirm attempts for the same reservation serialize),
   * then re-checks its status — idempotent per docs/v2/adr/0001.
   */
  async confirm(id: string, actor: ActorRef): Promise<StockReservation> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "stock_reservations" WHERE "id" = ${id} FOR UPDATE`;
      const record = await tx.stockReservation.findUnique({ where: { id } });
      if (!record) {
        throw new StockReservationNotFoundError(id);
      }

      const reservation = StockReservationMapper.toDomain(record);
      const shouldProceed = InventoryPolicy.assertReservationConfirmable(reservation);
      if (!shouldProceed) {
        return reservation;
      }

      await tx.variantStock.upsert({
        where: { variantId_warehouseId: { variantId: reservation.variantId, warehouseId: reservation.warehouseId } },
        update: {},
        create: { variantId: reservation.variantId, warehouseId: reservation.warehouseId, quantity: 0 },
      });

      const stockRows = await tx.$queryRaw<{ id: string; quantity: number }[]>`
        SELECT "id", "quantity" FROM "variant_stocks"
        WHERE "variantId" = ${reservation.variantId} AND "warehouseId" = ${reservation.warehouseId}
        FOR UPDATE
      `;
      const currentStock = stockRows[0];
      if (!currentStock) {
        throw new Error(
          `VariantStock row for variant "${reservation.variantId}" / warehouse "${reservation.warehouseId}" vanished mid-transaction.`,
        );
      }

      const delta = InventoryPolicy.computeStockDelta(STOCK_MOVEMENT_TYPE.SALE, reservation.quantity);
      const resultingStock = currentStock.quantity + delta;
      InventoryPolicy.assertNonNegativeResultingStock(resultingStock);

      await tx.variantStock.update({ where: { id: currentStock.id }, data: { quantity: resultingStock } });

      await tx.stockMovement.create({
        data: {
          variantId: reservation.variantId,
          warehouseId: reservation.warehouseId,
          type: STOCK_MOVEMENT_TYPE.SALE,
          quantity: reservation.quantity,
          resultingStock,
          actorId: actor.actorId,
          actorType: actor.actorType,
        },
      });

      const confirmedAt = new Date();
      const updated = await tx.stockReservation.update({
        where: { id },
        data: { status: STOCK_RESERVATION_STATUS.CONFIRMED, confirmedAt },
      });

      return StockReservationMapper.toDomain(updated);
    });
  }

  /** ACTIVE -> RELEASED. Idempotent — never touches stock. */
  async release(id: string): Promise<StockReservation> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "stock_reservations" WHERE "id" = ${id} FOR UPDATE`;
      const record = await tx.stockReservation.findUnique({ where: { id } });
      if (!record) {
        throw new StockReservationNotFoundError(id);
      }

      const reservation = StockReservationMapper.toDomain(record);
      const shouldProceed = InventoryPolicy.assertReservationReleasable(reservation);
      if (!shouldProceed) {
        return reservation;
      }

      const releasedAt = new Date();
      const updated = await tx.stockReservation.update({
        where: { id },
        data: { status: STOCK_RESERVATION_STATUS.RELEASED, releasedAt },
      });

      return StockReservationMapper.toDomain(updated);
    });
  }

  /** The background-sweep bulk update from docs/v2/adr/0001 §5 — no per-row locking needed for a single conditional UPDATE. */
  async expireAllDue(now: Date): Promise<number> {
    const result = await this.prisma.stockReservation.updateMany({
      where: { status: STOCK_RESERVATION_STATUS.ACTIVE, expiresAt: { lt: now } },
      data: { status: STOCK_RESERVATION_STATUS.EXPIRED },
    });
    return result.count;
  }

  async sumActiveQuantity(variantId: string, warehouseId: string): Promise<number> {
    const result = await this.prisma.stockReservation.aggregate({
      where: { variantId, warehouseId, status: STOCK_RESERVATION_STATUS.ACTIVE },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
