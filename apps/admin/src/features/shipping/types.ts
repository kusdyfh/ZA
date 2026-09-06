export const SHIPMENT_STATUSES = ['PENDING', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface ShippingZone {
  id: string;
  name: string;
  governorates: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRate {
  id: string;
  zoneId: string;
  methodId: string;
  fee: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
}

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
  shippingMethodId: string | null;
  status: ShipmentStatus;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  trackingEvents: ShipmentTrackingEvent[];
}
