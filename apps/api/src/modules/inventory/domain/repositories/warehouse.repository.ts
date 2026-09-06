import type { Warehouse } from '../entities/warehouse.entity';

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface CreateWarehouseData {
  storeId: string;
  name: string;
  code: string;
  isDefault: boolean;
}

export interface WarehouseRepository {
  create(data: CreateWarehouseData): Promise<Warehouse>;
  save(warehouse: Warehouse): Promise<void>;
  findById(storeId: string, id: string): Promise<Warehouse | null>;
  findByCode(storeId: string, code: string): Promise<Warehouse | null>;
  findDefault(storeId: string): Promise<Warehouse | null>;
  list(storeId: string): Promise<Warehouse[]>;
}
