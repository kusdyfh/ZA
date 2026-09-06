import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateShippingZoneDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  governorates?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
