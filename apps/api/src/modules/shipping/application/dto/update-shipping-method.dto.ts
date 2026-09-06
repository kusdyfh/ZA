import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateShippingMethodDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
