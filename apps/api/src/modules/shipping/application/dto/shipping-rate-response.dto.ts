import type { ShippingRate } from '../../domain/entities/shipping-rate.entity';

export class ShippingRateResponseDto {
  id!: string;
  zoneId!: string;
  methodId!: string;
  fee!: number;
  freeShippingThreshold!: number | null;
  isActive!: boolean;

  static fromDomain(this: void, rate: ShippingRate): ShippingRateResponseDto {
    const dto = new ShippingRateResponseDto();
    dto.id = rate.id;
    dto.zoneId = rate.zoneId;
    dto.methodId = rate.methodId;
    dto.fee = rate.fee;
    dto.freeShippingThreshold = rate.freeShippingThreshold;
    dto.isActive = rate.isActive;
    return dto;
  }
}
