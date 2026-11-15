import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/** An empty string from an admin form's "no selection" state means the same as omitting the field. */
const undefinedIfEmpty = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @Transform(undefinedIfEmpty)
  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
