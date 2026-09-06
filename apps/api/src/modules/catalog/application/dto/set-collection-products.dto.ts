import { IsArray, IsString } from 'class-validator';

/** Replaces a collection's full product membership + order in one call. */
export class SetCollectionProductsDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}
