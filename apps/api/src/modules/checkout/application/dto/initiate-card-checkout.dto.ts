import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class InitiateCardCheckoutDto {
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

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
