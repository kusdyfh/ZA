import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class SetShippingRateDto {
  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsString()
  @IsNotEmpty()
  methodId!: string;

  @IsNumber()
  @Min(0)
  fee!: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  freeShippingThreshold?: number;
}
