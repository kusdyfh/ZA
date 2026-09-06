import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  minDays!: number;

  @IsInt()
  @Min(0)
  maxDays!: number;
}
