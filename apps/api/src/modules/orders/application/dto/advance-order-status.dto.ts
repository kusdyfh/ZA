import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';

export class AdvanceOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsIn(Object.values(ORDER_STATUS))
  status!: string;

  @IsString()
  @IsOptional()
  note?: string;
}
