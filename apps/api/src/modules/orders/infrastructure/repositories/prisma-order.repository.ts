import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Order } from '../../domain/entities/order.entity';
import type {
  ChangeOrderStatusOptions,
  CreateOrderData,
  OrderListFilters,
  OrderRepository,
} from '../../domain/repositories/order.repository';
import { ORDER_STATUS, type OrderStatusValue } from '../../domain/constants/order-status.constants';
import type { PaymentStatusValue } from '../../domain/constants/payment-status.constants';
import { OrderPolicy } from '../../domain/policies/order-policy';
import { OrderNotFoundError } from '../../domain/errors/order.errors';
import { OrderMapper } from '../mappers/order.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  notes: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
  ) {}

  /**
   * Wrapped in `$transaction` (previously a single nested-write `create`
   * call — Prisma nested writes are already atomic, but don't offer a
   * slot for the unrelated `OutboxEvent` insert) so `OrderPlaced` commits
   * in the same transaction as the order itself, per ADR 0002/0023.
   */
  async create(data: CreateOrderData): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          storeId: data.storeId,
          orderNumber: data.orderNumber,
          status: ORDER_STATUS.PENDING,
          customerId: data.customerId ?? null,
          customerNameSnapshot: data.customerNameSnapshot,
          customerEmailSnapshot: data.customerEmailSnapshot,
          customerPhoneSnapshot: data.customerPhoneSnapshot,
          shippingFullName: data.shippingFullName,
          shippingPhone: data.shippingPhone,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2,
          shippingCity: data.shippingCity,
          shippingGovernorate: data.shippingGovernorate,
          shippingCountry: data.shippingCountry,
          subtotal: data.subtotal,
          discountTotal: data.discountTotal,
          shippingFee: data.shippingFee,
          taxTotal: data.taxTotal,
          total: data.total,
          currencyCode: data.currencyCode,
          shippingMethodId: data.shippingMethodId ?? null,
          paymentMethod: data.paymentMethod,
          items: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              stockReservationId: item.stockReservationId,
              productNameSnapshot: item.productNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
          statusHistory: {
            create: [{ status: ORDER_STATUS.PENDING, note: 'Order placed.', actorType: 'SYSTEM' }],
          },
        },
        include: ORDER_INCLUDE,
      });

      await this.outbox.writeInTransaction(tx, {
        storeId: data.storeId,
        eventType: EVENT_TYPES.ORDER_PLACED,
        aggregateId: created.id,
        aggregateType: 'Order',
        payload: {
          orderId: created.id,
          orderNumber: created.orderNumber,
          customerEmail: created.customerEmailSnapshot,
          total: Number(created.total),
          currencyCode: created.currencyCode,
        },
      });

      return created;
    });
    return OrderMapper.toDomain(record);
  }

  async findById(storeId: string, id: string): Promise<Order | null> {
    const record = await this.prisma.order.findFirst({ where: { id, storeId }, include: ORDER_INCLUDE });
    return record ? OrderMapper.toDomain(record) : null;
  }

  async findByOrderNumber(storeId: string, orderNumber: string): Promise<Order | null> {
    const record = await this.prisma.order.findUnique({
      where: { storeId_orderNumber: { storeId, orderNumber } },
      include: ORDER_INCLUDE,
    });
    return record ? OrderMapper.toDomain(record) : null;
  }

  async list(storeId: string, filters?: OrderListFilters): Promise<Order[]> {
    const records = await this.prisma.order.findMany({
      where: { storeId, ...(filters?.status ? { status: filters.status } : {}) },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(OrderMapper.toDomain);
  }

  /**
   * The only path that ever changes `Order.status` — validates the
   * transition via `OrderPolicy` (loaded fresh inside the transaction so
   * a concurrent transition can't race past it), then atomically updates
   * the order and appends a timeline row. See this port's doc comment.
   */
  async changeStatus(
    orderId: string,
    status: OrderStatusValue,
    note: string | null,
    actor: ActorRef,
    options?: ChangeOrderStatusOptions,
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) {
        throw new OrderNotFoundError(orderId);
      }

      OrderPolicy.assertValidTransition(current.status, status);

      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(options?.paymentStatus ? { paymentStatus: options.paymentStatus } : {}),
          ...(options?.cancelReason ? { cancelReason: options.cancelReason } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status, note, actorId: actor.actorId, actorType: actor.actorType },
      });

      // Epic 12 (ADR 0026) — a payment-status change bundled into this
      // transition (COD/CARD confirmation) also gets its own
      // PaymentStatusHistory row, since payment status is tracked
      // separately from order status per docs/product/12-PAYMENTS.md.
      if (options?.paymentStatus) {
        await tx.paymentStatusHistory.create({
          data: {
            storeId: current.storeId,
            orderId,
            status: options.paymentStatus,
            note,
            actorId: actor.actorId,
            actorType: actor.actorType,
          },
        });
      }

      await this.outbox.writeInTransaction(tx, {
        storeId: current.storeId,
        eventType: EVENT_TYPES.ORDER_STATUS_CHANGED,
        aggregateId: orderId,
        aggregateType: 'Order',
        payload: {
          orderId,
          orderNumber: current.orderNumber,
          customerEmail: current.customerEmailSnapshot,
          fromStatus: current.status,
          toStatus: status,
        },
      });

      const record = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
      return OrderMapper.toDomain(record);
    });
  }

  /**
   * Epic 12 (ADR 0026) — updates `paymentStatus` alone, appending to its
   * own dedicated `PaymentStatusHistory` timeline (not `OrderStatusHistory`
   * — docs/product/12-PAYMENTS.md: "payment status tracked separately from
   * order status"). No order-status transition, no `OrderPolicy` graph
   * check, since `status` itself never changes here.
   */
  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatusValue,
    note: string | null,
    actor: ActorRef,
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) {
        throw new OrderNotFoundError(orderId);
      }

      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: status } });
      await tx.paymentStatusHistory.create({
        data: { storeId: current.storeId, orderId, status, note, actorId: actor.actorId, actorType: actor.actorType },
      });

      const record = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
      return OrderMapper.toDomain(record);
    });
  }

  async addNote(orderId: string, body: string, isInternal: boolean, actor: ActorRef): Promise<Order> {
    const existing = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      throw new OrderNotFoundError(orderId);
    }

    await this.prisma.orderNote.create({
      data: { orderId, body, isInternal, actorId: actor.actorId, actorType: actor.actorType },
    });

    const record = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
    return OrderMapper.toDomain(record);
  }

  async listByCustomerId(customerId: string): Promise<Order[]> {
    const records = await this.prisma.order.findMany({
      where: { customerId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(OrderMapper.toDomain);
  }

  async associateGuestOrders(storeId: string, email: string, customerId: string): Promise<number> {
    const result = await this.prisma.order.updateMany({
      where: { storeId, customerEmailSnapshot: email, customerId: null },
      data: { customerId },
    });
    return result.count;
  }
}
