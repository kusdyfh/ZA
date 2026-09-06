import { IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../identity/domain/policies/password-policy';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  newPassword!: string;
}
