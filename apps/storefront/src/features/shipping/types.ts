export interface ShippingMethod {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
}

export interface ShippingRateQuote {
  fee: number;
  estimatedDays: { min: number; max: number } | null;
}

export const SHIPMENT_STATUSES = ['PENDING', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface ShipmentTrackingEvent {
  id: string;
  status: ShipmentStatus;
  note: string | null;
  location: string | null;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  trackingEvents: ShipmentTrackingEvent[];
}
