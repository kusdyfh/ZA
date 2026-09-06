import type { Shipment as PrismaShipment, ShipmentTrackingEvent as PrismaShipmentTrackingEvent } from '@prisma/client';
import type { ActorType } from '@za/types';
import { Shipment } from '../../domain/entities/shipment.entity';

type ShipmentRecordWithEvents = PrismaShipment & { trackingEvents: PrismaShipmentTrackingEvent[] };

export class ShipmentMapper {
  static toDomain(this: void, record: ShipmentRecordWithEvents): Shipment {
    return Shipment.reconstitute({
      id: record.id,
      storeId: record.storeId,
      orderId: record.orderId,
      shippingMethodId: record.shippingMethodId,
      status: record.status,
      carrierName: record.carrierName,
      trackingNumber: record.trackingNumber,
      trackingUrl: record.trackingUrl,
      labelUrl: record.labelUrl,
      dispatchedAt: record.dispatchedAt,
      deliveredAt: record.deliveredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      trackingEvents: record.trackingEvents.map((event) => ({
        id: event.id,
        shipmentId: event.shipmentId,
        status: event.status,
        note: event.note,
        location: event.location,
        actorId: event.actorId,
        actorType: event.actorType as ActorType,
        createdAt: event.createdAt,
      })),
    });
  }
}
