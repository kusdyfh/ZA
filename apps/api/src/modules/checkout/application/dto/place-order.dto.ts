import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IRAQ_GOVERNORATE_NAMES } from '@za/shared';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';

export class PlaceOrderDto {
  @IsString()
  @IsNotEmpty()
  guestToken!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  /** Optional at checkout (product decision) — phone is required instead. */
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @IsString()
  @IsNotEmpty()
  shippingFullName!: string;

  @IsString()
  @IsNotEmpty()
  shippingPhone!: string;

  @IsString()
  @IsNotEmpty()
  shippingLine1!: string;

  @IsString()
  @IsOptional()
  shippingLine2?: string;

  @IsString()
  @IsNotEmpty()
  shippingCity!: string;

  /** Delivery is Iraq-only (product decision) — a closed list, not free text. */
  @IsIn(IRAQ_GOVERNORATE_NAMES)
  shippingGovernorate!: string;

  @IsIn(['Iraq'])
  shippingCountry!: string;

  @IsString()
  @IsNotEmpty()
  shippingMethodId!: string;

  @IsIn(Object.values(PAYMENT_METHOD))
  paymentMethod!: string;
}
