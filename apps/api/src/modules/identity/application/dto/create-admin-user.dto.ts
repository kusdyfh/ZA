import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../domain/policies/password-policy';

/**
 * Interface-layer validation (class-validator) intentionally overlaps
 * with the domain layer's own Email/PasswordPolicy checks — that's
 * "defense in depth," per docs/v2/08-API-REVIEW.md §6, not accidental
 * duplication: the domain must stay correct even when called from a
 * future non-HTTP entry point (an admin CLI, a seed script) that never
 * passes through this DTO at all.
 */
export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password!: string;

  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
