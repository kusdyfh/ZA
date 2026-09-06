import { IsIn } from 'class-validator';
import { PRODUCT_STATUS, type ProductStatusValue } from '../../domain/constants/product-status.constants';

export class ChangeProductStatusDto {
  @IsIn(Object.values(PRODUCT_STATUS))
  status!: ProductStatusValue;
}
