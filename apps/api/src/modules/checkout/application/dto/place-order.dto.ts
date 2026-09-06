import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';

export class PlaceOrderDto {
  @IsString()
  @IsNotEmpty()
  guestToken!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  customerEmail!: string;

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

  @IsString()
  @IsNotEmpty()
  shippingGovernorate!: string;

  @IsString()
  @IsNotEmpty()
  shippingCountry!: string;

  @IsString()
  @IsNotEmpty()
  shippingMethodId!: string;

  @IsIn(Object.values(PAYMENT_METHOD))
  paymentMethod!: string;
}
