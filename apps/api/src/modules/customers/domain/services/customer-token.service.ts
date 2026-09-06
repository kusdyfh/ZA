export const CUSTOMER_TOKEN_SERVICE = Symbol('CUSTOMER_TOKEN_SERVICE');

export interface CustomerAccessTokenPayload {
  sub: string;
  type: 'customer-access';
}

export interface CustomerRefreshTokenPayload {
  sub: string;
  jti: string;
  familyId: string;
  type: 'customer-refresh';
}

/**
 * The Customer-side equivalent of Auth's `TokenService` (ADR 0017 §1) —
 * a separate port/implementation with its own secrets (ADR 0018 §2), not
 * a shared one. Same "reject, don't return null" contract on verify.
 */
export interface CustomerTokenService {
  signAccessToken(customerId: string): Promise<string>;
  signRefreshToken(customerId: string, jti: string, familyId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<CustomerAccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<CustomerRefreshTokenPayload>;
}
