import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** An empty string from an admin form's "no selection" state means the same as omitting the field. */
const undefinedIfEmpty = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class UpdateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @Transform(undefinedIfEmpty)
  @IsString()
  @IsOptional()
  colorId?: string;

  @Transform(undefinedIfEmpty)
  @IsString()
  @IsOptional()
  sizeId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceOverride?: number;
}
