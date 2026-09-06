import type { ShipmentTrackingEvent } from '../../domain/entities/shipment-tracking-event.entity';

export class ShipmentTrackingEventResponseDto {
  id!: string;
  status!: string;
  note!: string | null;
  location!: string | null;
  createdAt!: Date;

  static fromDomain(this: void, event: ShipmentTrackingEvent): ShipmentTrackingEventResponseDto {
    const dto = new ShipmentTrackingEventResponseDto();
    dto.id = event.id;
    dto.status = event.status;
    dto.note = event.note;
    dto.location = event.location;
    dto.createdAt = event.createdAt;
    return dto;
  }
}
