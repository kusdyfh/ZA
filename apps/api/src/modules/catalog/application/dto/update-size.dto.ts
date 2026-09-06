import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSizeDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
