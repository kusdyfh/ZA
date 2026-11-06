import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ListQueryDto } from '../../../../shared/pagination/list-query.dto';
import { PRODUCT_PLACEMENTS } from '../../domain/constants/product-placement.constants';

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

/**
 * Public product-listing filters (ADR 0021 §2/§4) — deliberately has no
 * `status` field at all (unlike the admin `ListProductsQueryDto`), so
 * no client input can ever request non-ACTIVE products; the controller
 * always forces `status: PRODUCT_STATUS.ACTIVE` regardless of this DTO.
 */
export class PublicListProductsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  colorId?: string;

  @IsOptional()
  @IsString()
  sizeId?: string;

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

  /** Matches products curated into this homepage section — see ProductPlacement. */
  @IsOptional()
  @IsIn(PRODUCT_PLACEMENTS)
  placement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;
}
