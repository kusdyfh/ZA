import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveCartItemDto {
  @IsString()
  @IsNotEmpty()
  guestToken!: string;

  @IsString()
  @IsNotEmpty()
  variantId!: string;
}
