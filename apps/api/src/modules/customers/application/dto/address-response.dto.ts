import type { CustomerAddress } from '../../domain/entities/customer-address.entity';

export class AddressResponseDto {
  id!: string;
  fullName!: string;
  phone!: string;
  line1!: string;
  line2!: string | null;
  city!: string;
  governorate!: string;
  country!: string;
  isDefault!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(address: CustomerAddress): AddressResponseDto {
    const dto = new AddressResponseDto();
    dto.id = address.id;
    dto.fullName = address.fullName;
    dto.phone = address.phone;
    dto.line1 = address.line1;
    dto.line2 = address.line2;
    dto.city = address.city;
    dto.governorate = address.governorate;
    dto.country = address.country;
    dto.isDefault = address.isDefault;
    dto.createdAt = address.createdAt;
    dto.updatedAt = address.updatedAt;
    return dto;
  }
}
