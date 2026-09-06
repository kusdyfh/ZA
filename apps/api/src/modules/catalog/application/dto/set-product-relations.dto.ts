import { IsArray, IsIn, IsString } from 'class-validator';
import {
  PRODUCT_RELATION_TYPE,
  type ProductRelationTypeValue,
} from '../../domain/constants/product-relation-type.constants';

/** Fully replaces a product's relations of one type + order in one call. */
export class SetProductRelationsDto {
  @IsIn(Object.values(PRODUCT_RELATION_TYPE))
  type!: ProductRelationTypeValue;

  @IsArray()
  @IsString({ each: true })
  relatedProductIds!: string[];
}
