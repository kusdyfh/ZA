import type { RefreshToken } from '../../domain/entities/refresh-token.entity';

/** Never exposes the token's `jti` or the raw JWT — id is a safe, opaque handle for DELETE /auth/sessions/:id. */
export class SessionResponseDto {
  id!: string;
  issuedAt!: Date;
  expiresAt!: Date;
  userAgent!: string | null;
  ipAddress!: string | null;

  static fromDomain(token: RefreshToken): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.id = token.id;
    dto.issuedAt = token.issuedAt;
    dto.expiresAt = token.expiresAt;
    dto.userAgent = token.userAgent;
    dto.ipAddress = token.ipAddress;
    return dto;
  }
}
