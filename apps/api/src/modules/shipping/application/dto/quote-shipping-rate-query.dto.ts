import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteShippingRateQueryDto {
  @IsString()
  @IsNotEmpty()
  governorate!: string;

  @IsString()
  @IsNotEmpty()
  methodId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountTotal?: number;
}
