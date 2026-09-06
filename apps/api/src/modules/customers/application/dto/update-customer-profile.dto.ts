import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsBoolean()
  marketingOptIn!: boolean;
}
