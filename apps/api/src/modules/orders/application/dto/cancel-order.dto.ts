import { IsNotEmpty, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
