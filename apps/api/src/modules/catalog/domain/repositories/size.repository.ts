import type { Size } from '../entities/size.entity';

export const SIZE_REPOSITORY = Symbol('SIZE_REPOSITORY');

export interface CreateSizeData {
  storeId: string;
  label: string;
  sortOrder: number;
}

export interface SizeRepository {
  create(data: CreateSizeData): Promise<Size>;
  save(size: Size): Promise<void>;
  findById(storeId: string, id: string): Promise<Size | null>;
  findByLabel(storeId: string, label: string): Promise<Size | null>;
  list(storeId: string): Promise<Size[]>;
  delete(storeId: string, id: string): Promise<void>;
}
