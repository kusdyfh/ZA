import type { ShippingRate } from '../entities/shipping-rate.entity';

export const SHIPPING_RATE_REPOSITORY = Symbol('SHIPPING_RATE_REPOSITORY');

export interface UpsertShippingRateData {
  storeId: string;
  zoneId: string;
  methodId: string;
  fee: number;
  freeShippingThreshold?: number | null;
}

export interface ShippingRateRepository {
  /** One rate per (zone, method) pair — creates or replaces, per the schema's `@@unique([zoneId, methodId])`. */
  upsert(data: UpsertShippingRateData): Promise<ShippingRate>;
  findByZoneAndMethod(storeId: string, zoneId: string, methodId: string): Promise<ShippingRate | null>;
  list(storeId: string): Promise<ShippingRate[]>;
}
