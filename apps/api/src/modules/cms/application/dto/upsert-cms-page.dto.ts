import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CMS_PAGE_SLUGS } from '../../domain/cms-page-slugs';

export class CmsFaqItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() question!: string;
  @ApiProperty() @IsString() @IsNotEmpty() answer!: string;
}

export class UpsertCmsPageDto {
  @ApiProperty({ enum: CMS_PAGE_SLUGS })
  @IsIn(CMS_PAGE_SLUGS)
  slug!: string;

  @ApiProperty() @IsString() @IsNotEmpty() title!: string;

  @ApiProperty() @IsString() content!: string;

  @ApiProperty({ type: [CmsFaqItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CmsFaqItemDto)
  faqItems?: CmsFaqItemDto[];

  @ApiProperty({ required: false }) @IsOptional() @IsString() metaTitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() metaDescription?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() ogImageUrl?: string;
}
