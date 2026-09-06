import type { AdminUser } from '../../../identity/domain/entities/admin-user.entity';
import { AdminUserResponseDto } from '../../../identity/application/dto/admin-user-response.dto';
import { AuthPolicy } from '../../domain/policies/auth-policy';

/** Shape returned by both /auth/login and /auth/refresh. */
export class AuthTokensResponseDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: number;
  adminUser?: AdminUserResponseDto;

  static fromTokens(
    accessToken: string,
    refreshToken: string,
    adminUser?: AdminUser,
  ): AuthTokensResponseDto {
    const dto = new AuthTokensResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.tokenType = 'Bearer';
    dto.expiresIn = AuthPolicy.ACCESS_TOKEN_TTL_SECONDS;
    dto.adminUser = adminUser ? AdminUserResponseDto.fromDomain(adminUser) : undefined;
    return dto;
  }
}
