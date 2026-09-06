import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
