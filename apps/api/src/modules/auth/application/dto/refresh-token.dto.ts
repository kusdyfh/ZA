import { IsString, MinLength } from 'class-validator';

/** Shared body shape for both /auth/refresh and /auth/logout. */
export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
