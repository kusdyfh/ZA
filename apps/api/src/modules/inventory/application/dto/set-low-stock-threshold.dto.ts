import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SetLowStockThresholdDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  /** Omit (null) to clear the threshold — low-stock checks are then always false for this variant/warehouse. */
  @IsInt()
  @Min(0)
  @IsOptional()
  threshold?: number | null;
}
