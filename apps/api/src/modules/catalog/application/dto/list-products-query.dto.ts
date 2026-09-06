import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/pagination/list-query.dto';
import { PRODUCT_STATUS, type ProductStatusValue } from '../../domain/constants/product-status.constants';

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

/** Equality filters per docs/08-API-REVIEW.md §3 — bare params, passed straight to `ProductListFilters`. */
export class ListProductsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(Object.values(PRODUCT_STATUS))
  status?: ProductStatusValue;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isNewArrival?: boolean;
}
