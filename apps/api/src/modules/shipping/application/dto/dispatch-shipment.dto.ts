import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DispatchShipmentDto {
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @IsString()
  @IsOptional()
  carrierName?: string;
}
