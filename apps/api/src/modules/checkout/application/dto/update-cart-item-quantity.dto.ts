import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class UpdateCartItemQuantityDto {
  @IsString()
  @IsNotEmpty()
  guestToken!: string;

  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
