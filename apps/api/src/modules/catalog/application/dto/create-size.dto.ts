import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
