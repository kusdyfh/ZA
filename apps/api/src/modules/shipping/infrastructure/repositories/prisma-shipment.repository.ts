import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import type {
  CreateShipmentData,
  DispatchShipmentData,
  ShipmentRepository,
} from '../../domain/repositories/shipment.repository';
import { SHIPMENT_STATUS, type ShipmentStatusValue } from '../../domain/constants/shipment-status.constants';
import { ShippingPolicy } from '../../domain/policies/shipping-policy';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';
import { ShipmentMapper } from '../mappers/shipment.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

const SHIPMENT_INCLUDE = { trackingEvents: { orderBy: { createdAt: 'asc' as const } } };

@Injectable()
export class PrismaShipmentRepository implements ShipmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
  ) {}

  /**
   * Called by `PlaceOrderUseCase`/`ConfirmCardPaymentUseCase` right after
   * `Order` creation succeeds (ADR 0027 — revised: not nested inside
   * `PrismaOrderRepository.create()`'s own transaction, to avoid a
   * circular module dependency; see the port's doc comment). One Shipment
   * per Order, created at `PENDING`.
   */
  async create(data: CreateShipmentData): Promise<Shipment> {
    const record = await this.prisma.shipment.create({
      data: {
        storeId: data.storeId,
        orderId: data.orderId,
        shippingMethodId: data.shippingMethodId,
        status: SHIPMENT_STATUS.PENDING,
        trackingEvents: { create: [{ status: SHIPMENT_STATUS.PENDING, note: 'Shipment created.', actorType: 'SYSTEM' }] },
      },
      include: SHIPMENT_INCLUDE,
    });
    return ShipmentMapper.toDomain(record);
  }

  async findById(storeId: string, id: string): Promise<Shipment | null> {
    const record = await this.prisma.shipment.findFirst({ where: { id, storeId }, include: SHIPMENT_INCLUDE });
    return record ? ShipmentMapper.toDomain(record) : null;
  }

  async findByOrderId(storeId: string, orderId: string): Promise<Shipment | null> {
    const record = await this.prisma.shipment.findFirst({ where: { orderId, storeId }, include: SHIPMENT_INCLUDE });
    return record ? ShipmentMapper.toDomain(record) : null;
  }

  async dispatch(id: string, data: DispatchShipmentData, actor: ActorRef): Promise<Shipment> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.shipment.findUnique({ where: { id }, include: { order: true } });
      if (!current) {
        throw new ShipmentNotFoundError(id);
      }
      ShippingPolicy.assertValidTransition(current.status, SHIPMENT_STATUS.IN_TRANSIT);

      await tx.shipment.update({
        where: { id },
        data: {
          status: SHIPMENT_STATUS.IN_TRANSIT,
          trackingNumber: data.trackingNumber,
          carrierName: data.carrierName,
          trackingUrl: data.trackingUrl,
          labelUrl: data.labelUrl,
          dispatchedAt: new Date(),
        },
      });
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: id,
          status: SHIPMENT_STATUS.IN_TRANSIT,
          note: `Dispatched${data.carrierName ? ` via ${data.carrierName}` : ''}.`,
          actorId: actor.actorId,
          actorType: actor.actorType,
        },
      });

      await this.outbox.writeInTransaction(tx, {
        storeId: current.storeId,
        eventType: EVENT_TYPES.SHIPMENT_DISPATCHED,
        aggregateId: id,
        aggregateType: 'Shipment',
        payload: {
          shipmentId: id,
          orderId: current.orderId,
          orderNumber: current.order.orderNumber,
          customerEmail: current.order.customerEmailSnapshot,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
        },
      });

      const record = await tx.shipment.findUniqueOrThrow({ where: { id }, include: SHIPMENT_INCLUDE });
      return ShipmentMapper.toDomain(record);
    });
  }

  async markDelivered(id: string, actor: ActorRef): Promise<Shipment> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.shipment.findUnique({ where: { id }, include: { order: true } });
      if (!current) {
        throw new ShipmentNotFoundError(id);
      }
      ShippingPolicy.assertValidTransition(current.status, SHIPMENT_STATUS.DELIVERED);

      await tx.shipment.update({ where: { id }, data: { status: SHIPMENT_STATUS.DELIVERED, deliveredAt: new Date() } });
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: id,
          status: SHIPMENT_STATUS.DELIVERED,
          note: 'Delivered.',
          actorId: actor.actorId,
          actorType: actor.actorType,
        },
      });

      await this.outbox.writeInTransaction(tx, {
        storeId: current.storeId,
        eventType: EVENT_TYPES.SHIPMENT_DELIVERED,
        aggregateId: id,
        aggregateType: 'Shipment',
        payload: {
          shipmentId: id,
          orderId: current.orderId,
          orderNumber: current.order.orderNumber,
          customerEmail: current.order.customerEmailSnapshot,
        },
      });

      const record = await tx.shipment.findUniqueOrThrow({ where: { id }, include: SHIPMENT_INCLUDE });
      return ShipmentMapper.toDomain(record);
    });
  }

  async appendTrackingEvent(
    id: string,
    status: ShipmentStatusValue,
    note: string | null,
    actor: ActorRef,
  ): Promise<Shipment> {
    const existing = await this.prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      throw new ShipmentNotFoundError(id);
    }
    await this.prisma.shipmentTrackingEvent.create({
      data: { shipmentId: id, status, note, actorId: actor.actorId, actorType: actor.actorType },
    });
    const record = await this.prisma.shipment.findUniqueOrThrow({ where: { id }, include: SHIPMENT_INCLUDE });
    return ShipmentMapper.toDomain(record);
  }

  async list(storeId: string): Promise<Shipment[]> {
    const records = await this.prisma.shipment.findMany({
      where: { storeId },
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(ShipmentMapper.toDomain);
  }
}
