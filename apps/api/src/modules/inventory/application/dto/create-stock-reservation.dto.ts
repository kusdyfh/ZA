import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateStockReservationDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsNotEmpty()
  cartId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
