import type { Warehouse } from '../../domain/entities/warehouse.entity';

export class WarehouseResponseDto {
  id!: string;
  name!: string;
  code!: string;
  isDefault!: boolean;

  static fromDomain(warehouse: Warehouse): WarehouseResponseDto {
    const dto = new WarehouseResponseDto();
    dto.id = warehouse.id;
    dto.name = warehouse.name;
    dto.code = warehouse.code;
    dto.isDefault = warehouse.isDefault;
    return dto;
  }
}
