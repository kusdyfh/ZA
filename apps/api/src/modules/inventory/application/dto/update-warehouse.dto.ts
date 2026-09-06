import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
