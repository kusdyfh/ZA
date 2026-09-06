import type { ShippingMethod } from '../entities/shipping-method.entity';

export const SHIPPING_METHOD_REPOSITORY = Symbol('SHIPPING_METHOD_REPOSITORY');

export interface CreateShippingMethodData {
  storeId: string;
  name: string;
  minDays: number;
  maxDays: number;
}

export interface UpdateShippingMethodData {
  name?: string;
  minDays?: number;
  maxDays?: number;
  isActive?: boolean;
}

export interface ShippingMethodRepository {
  create(data: CreateShippingMethodData): Promise<ShippingMethod>;
  update(storeId: string, id: string, data: UpdateShippingMethodData): Promise<ShippingMethod>;
  findById(storeId: string, id: string): Promise<ShippingMethod | null>;
  list(storeId: string): Promise<ShippingMethod[]>;
}
