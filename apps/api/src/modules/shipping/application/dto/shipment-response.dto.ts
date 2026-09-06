import type { Shipment } from '../../domain/entities/shipment.entity';
import { ShipmentTrackingEventResponseDto } from './shipment-tracking-event-response.dto';

export class ShipmentResponseDto {
  id!: string;
  orderId!: string;
  shippingMethodId!: string | null;
  status!: string;
  carrierName!: string | null;
  trackingNumber!: string | null;
  trackingUrl!: string | null;
  labelUrl!: string | null;
  dispatchedAt!: Date | null;
  deliveredAt!: Date | null;
  trackingEvents!: ShipmentTrackingEventResponseDto[];

  static fromDomain(this: void, shipment: Shipment): ShipmentResponseDto {
    const dto = new ShipmentResponseDto();
    dto.id = shipment.id;
    dto.orderId = shipment.orderId;
    dto.shippingMethodId = shipment.shippingMethodId;
    dto.status = shipment.status;
    dto.carrierName = shipment.carrierName;
    dto.trackingNumber = shipment.trackingNumber;
    dto.trackingUrl = shipment.trackingUrl;
    dto.labelUrl = shipment.labelUrl;
    dto.dispatchedAt = shipment.dispatchedAt;
    dto.deliveredAt = shipment.deliveredAt;
    dto.trackingEvents = shipment.trackingEvents.map(ShipmentTrackingEventResponseDto.fromDomain);
    return dto;
  }
}
