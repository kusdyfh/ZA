import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { PRODUCT_MEDIA_TYPE, type ProductMediaTypeValue } from '../../domain/constants/product-media-type.constants';

export class ProductMediaEntryDto {
  @IsIn(Object.values(PRODUCT_MEDIA_TYPE))
  type!: ProductMediaTypeValue;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsBoolean()
  isCover!: boolean;
}

/** Fully replaces a product's media set + order in one call. */
export class SetProductMediaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaEntryDto)
  media!: ProductMediaEntryDto[];
}
