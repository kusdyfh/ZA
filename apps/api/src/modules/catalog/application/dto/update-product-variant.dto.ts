import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  colorId?: string;

  @IsString()
  @IsOptional()
  sizeId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceOverride?: number;
}
