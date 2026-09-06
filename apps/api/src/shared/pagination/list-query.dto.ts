import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * The generic page/limit/sort/search query shape every list endpoint
 * accepts — per docs/08-API-REVIEW.md §§3-5 and
 * docs/v2/adr/0016-api-layer-conventions.md §3. `sort` follows
 * `field:direction`, comma-separated for tie-breaking
 * (`isFeatured:desc,createdAt:desc`); `search` is a plain substring
 * query matched against each endpoint's own allow-listed fields.
 */
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
