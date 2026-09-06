import type { ShippingMethod } from '../../domain/entities/shipping-method.entity';

export class ShippingMethodResponseDto {
  id!: string;
  name!: string;
  minDays!: number;
  maxDays!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(this: void, method: ShippingMethod): ShippingMethodResponseDto {
    const dto = new ShippingMethodResponseDto();
    dto.id = method.id;
    dto.name = method.name;
    dto.minDays = method.minDays;
    dto.maxDays = method.maxDays;
    dto.isActive = method.isActive;
    dto.createdAt = method.createdAt;
    dto.updatedAt = method.updatedAt;
    return dto;
  }
}
