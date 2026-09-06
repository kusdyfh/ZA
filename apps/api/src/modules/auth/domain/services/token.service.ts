export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  familyId: string;
  type: 'refresh';
}

/**
 * Port — JWT signing/verification is an infrastructure concern (the
 * concrete `@nestjs/jwt`-backed implementation lives in
 * infrastructure/tokens). Domain and application code depend only on
 * this shape, same pattern as Identity's PasswordHasher port.
 *
 * `verifyAccessToken`/`verifyRefreshToken` reject (throwing whatever the
 * underlying JWT library throws — expired/malformed/wrong signature)
 * rather than returning null; callers (JwtAuthGuard, application
 * use-cases) each translate that into whatever's appropriate for their
 * layer (a plain 401 HttpException for the guard, a domain error for a
 * use-case) — this port doesn't know or care which.
 */
export interface TokenService {
  signAccessToken(adminUserId: string): Promise<string>;
  signRefreshToken(adminUserId: string, jti: string, familyId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
