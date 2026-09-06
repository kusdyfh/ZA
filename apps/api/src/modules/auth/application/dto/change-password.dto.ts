import { IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../identity/domain/policies/password-policy';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  newPassword!: string;
}
