import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class AddCartItemDto {
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
