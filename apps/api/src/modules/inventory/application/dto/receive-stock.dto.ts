import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class ReceiveStockDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsString()
  @IsOptional()
  note?: string;
}
