import { ApiProperty } from '@nestjs/swagger';
import type { CmsFaqItem, CmsPage } from '../../domain/entities/cms-page.entity';

class CmsFaqItemDto {
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
}

export class CmsPageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ type: [CmsFaqItemDto], nullable: true }) faqItems!: CmsFaqItem[] | null;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) metaTitle!: string | null;
  @ApiProperty({ nullable: true }) metaDescription!: string | null;
  @ApiProperty({ nullable: true }) ogImageUrl!: string | null;
  @ApiProperty({ nullable: true }) publishedAt!: string | null;
  @ApiProperty() updatedAt!: string;

  static fromDomain(this: void, page: CmsPage): CmsPageResponseDto {
    const dto = new CmsPageResponseDto();
    dto.id = page.id;
    dto.slug = page.slug;
    dto.title = page.title;
    dto.content = page.content;
    dto.faqItems = page.faqItems;
    dto.status = page.status;
    dto.metaTitle = page.metaTitle;
    dto.metaDescription = page.metaDescription;
    dto.ogImageUrl = page.ogImageUrl;
    dto.publishedAt = page.publishedAt ? page.publishedAt.toISOString() : null;
    dto.updatedAt = page.updatedAt.toISOString();
    return dto;
  }
}
