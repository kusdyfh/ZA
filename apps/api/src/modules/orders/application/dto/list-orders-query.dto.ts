import { IsIn, IsOptional } from 'class-validator';
import { ListQueryDto } from '../../../../shared/pagination/list-query.dto';
import { ORDER_STATUS, type OrderStatusValue } from '../../domain/constants/order-status.constants';

export class ListOrdersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(Object.values(ORDER_STATUS))
  status?: OrderStatusValue;
}
