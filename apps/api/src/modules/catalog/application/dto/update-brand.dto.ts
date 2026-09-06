import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateBrandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
