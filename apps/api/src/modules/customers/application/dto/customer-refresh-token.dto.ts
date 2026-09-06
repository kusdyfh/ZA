import { IsString, MinLength } from 'class-validator';

/** Shared body shape for /customers/auth/refresh and /customers/auth/logout. */
export class CustomerRefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
