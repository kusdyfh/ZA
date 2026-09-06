import { IsString, MinLength } from 'class-validator';
import { CustomerPolicy } from '../../domain/policies/customer-policy';

export class ChangeCustomerPasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(CustomerPolicy.PASSWORD_MIN_LENGTH)
  newPassword!: string;
}
