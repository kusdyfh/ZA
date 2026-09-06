import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class ProductSpecificationEntryDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

/** Fully replaces a product's specification sheet + order in one call. */
export class SetProductSpecificationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationEntryDto)
  specifications!: ProductSpecificationEntryDto[];
}
