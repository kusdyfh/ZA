import type { CustomerRefreshToken } from '../entities/customer-refresh-token.entity';

export const CUSTOMER_REFRESH_TOKEN_REPOSITORY = Symbol('CUSTOMER_REFRESH_TOKEN_REPOSITORY');

export interface CreateCustomerRefreshTokenData {
  jti: string;
  familyId: string;
  customerId: string;
  expiresAt: Date;
}

export interface CustomerRefreshTokenRepository {
  create(data: CreateCustomerRefreshTokenData): Promise<CustomerRefreshToken>;
  findByJti(jti: string): Promise<CustomerRefreshToken | null>;
  save(token: CustomerRefreshToken): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForCustomer(customerId: string): Promise<void>;
}
