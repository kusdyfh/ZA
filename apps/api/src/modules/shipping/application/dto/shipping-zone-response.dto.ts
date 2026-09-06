import type { ShippingZone } from '../../domain/entities/shipping-zone.entity';

export class ShippingZoneResponseDto {
  id!: string;
  name!: string;
  governorates!: string[];
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(this: void, zone: ShippingZone): ShippingZoneResponseDto {
    const dto = new ShippingZoneResponseDto();
    dto.id = zone.id;
    dto.name = zone.name;
    dto.governorates = zone.governorates;
    dto.isActive = zone.isActive;
    dto.createdAt = zone.createdAt;
    dto.updatedAt = zone.updatedAt;
    return dto;
  }
}
