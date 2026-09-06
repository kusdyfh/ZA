import type { Color } from '../entities/color.entity';

export const COLOR_REPOSITORY = Symbol('COLOR_REPOSITORY');

export interface CreateColorData {
  storeId: string;
  name: string;
  hexCode: string;
}

export interface ColorRepository {
  create(data: CreateColorData): Promise<Color>;
  save(color: Color): Promise<void>;
  findById(storeId: string, id: string): Promise<Color | null>;
  findByName(storeId: string, name: string): Promise<Color | null>;
  list(storeId: string): Promise<Color[]>;
  delete(storeId: string, id: string): Promise<void>;
}
