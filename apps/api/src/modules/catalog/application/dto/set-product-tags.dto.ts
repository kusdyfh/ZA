import { IsArray, IsString } from 'class-validator';

export class SetProductTagsDto {
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}
