import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class IssueRefundDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
