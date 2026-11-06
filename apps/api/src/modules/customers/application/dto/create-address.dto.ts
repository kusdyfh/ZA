import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IRAQ_GOVERNORATE_NAMES } from '@za/shared';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  @MinLength(1)
  city!: string;

  /** Delivery is Iraq-only (product decision) — a closed list, not free text. */
  @IsIn(IRAQ_GOVERNORATE_NAMES)
  governorate!: string;

  @IsIn(['Iraq'])
  country!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
