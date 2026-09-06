import type { ShipmentStatusValue } from '../constants/shipment-status.constants';
import { ShipmentTrackingEvent, type ShipmentTrackingEventProps } from './shipment-tracking-event.entity';

export interface ShipmentProps {
  id: string;
  storeId: string;
  orderId: string;
  shippingMethodId: string | null;
  status: ShipmentStatusValue;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  trackingEvents: ShipmentTrackingEventProps[];
}

/**
 * One shipment per order (ADR 0027) — created automatically at `PENDING`
 * the moment an `Order` is created. Immutable/reconstitute-only, mirroring
 * `Order`'s own convention — the repository (`dispatch`/`markDelivered`) is
 * the only place `status`/tracking fields ever change.
 */
export class Shipment {
  private constructor(private readonly props: ShipmentProps) {}

  static reconstitute(props: ShipmentProps): Shipment {
    return new Shipment(props);
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get shippingMethodId(): string | null {
    return this.props.shippingMethodId;
  }

  get status(): ShipmentStatusValue {
    return this.props.status;
  }

  get carrierName(): string | null {
    return this.props.carrierName;
  }

  get trackingNumber(): string | null {
    return this.props.trackingNumber;
  }

  get trackingUrl(): string | null {
    return this.props.trackingUrl;
  }

  get labelUrl(): string | null {
    return this.props.labelUrl;
  }

  get dispatchedAt(): Date | null {
    return this.props.dispatchedAt;
  }

  get deliveredAt(): Date | null {
    return this.props.deliveredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get trackingEvents(): ShipmentTrackingEvent[] {
    return this.props.trackingEvents.map((event) => ShipmentTrackingEvent.reconstitute(event));
  }

  toProps(): ShipmentProps {
    return { ...this.props };
  }
}
