import type { ShippingZone } from '../entities/shipping-zone.entity';

export const SHIPPING_ZONE_REPOSITORY = Symbol('SHIPPING_ZONE_REPOSITORY');

export interface CreateShippingZoneData {
  storeId: string;
  name: string;
  governorates: string[];
}

export interface UpdateShippingZoneData {
  name?: string;
  governorates?: string[];
  isActive?: boolean;
}

export interface ShippingZoneRepository {
  create(data: CreateShippingZoneData): Promise<ShippingZone>;
  update(storeId: string, id: string, data: UpdateShippingZoneData): Promise<ShippingZone>;
  findById(storeId: string, id: string): Promise<ShippingZone | null>;
  findByGovernorate(storeId: string, governorate: string): Promise<ShippingZone | null>;
  list(storeId: string): Promise<ShippingZone[]>;
}
