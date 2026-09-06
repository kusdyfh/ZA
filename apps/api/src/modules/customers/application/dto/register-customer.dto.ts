import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomerPolicy } from '../../domain/policies/customer-policy';

export class RegisterCustomerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(CustomerPolicy.PASSWORD_MIN_LENGTH)
  password!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  /** A guest cart to merge in — ADR 0018 §3. */
  @IsOptional()
  @IsString()
  guestToken?: string;
}
