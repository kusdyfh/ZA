import { IsArray, IsOptional, IsString } from 'class-validator';

/** "Product Highlights" + "Rich Content" — grouped since both are supplementary descriptive content on Product. */
export class UpdateProductContentDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  highlights?: string[];

  @IsString()
  @IsOptional()
  richContent?: string;
}
