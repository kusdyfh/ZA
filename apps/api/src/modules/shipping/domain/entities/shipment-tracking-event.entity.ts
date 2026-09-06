import type { ActorType } from '@za/types';
import type { ShipmentStatusValue } from '../constants/shipment-status.constants';

export interface ShipmentTrackingEventProps {
  id: string;
  shipmentId: string;
  status: ShipmentStatusValue;
  note: string | null;
  location: string | null;
  actorId: string | null;
  actorType: ActorType;
  createdAt: Date;
}

/** Immutable once written — mirrors OrderStatusHistoryEntry. */
export class ShipmentTrackingEvent {
  private constructor(private readonly props: ShipmentTrackingEventProps) {}

  static reconstitute(props: ShipmentTrackingEventProps): ShipmentTrackingEvent {
    return new ShipmentTrackingEvent(props);
  }

  get id(): string {
    return this.props.id;
  }

  get shipmentId(): string {
    return this.props.shipmentId;
  }

  get status(): ShipmentStatusValue {
    return this.props.status;
  }

  get note(): string | null {
    return this.props.note;
  }

  get location(): string | null {
    return this.props.location;
  }

  get actorId(): string | null {
    return this.props.actorId;
  }

  get actorType(): ActorType {
    return this.props.actorType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): ShipmentTrackingEventProps {
    return { ...this.props };
  }
}
