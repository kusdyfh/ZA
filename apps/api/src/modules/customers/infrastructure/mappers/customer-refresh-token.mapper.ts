import type { CustomerRefreshToken as CustomerRefreshTokenRecord } from '@prisma/client';
import { CustomerRefreshToken } from '../../domain/entities/customer-refresh-token.entity';

export class CustomerRefreshTokenMapper {
  static toDomain(this: void, record: CustomerRefreshTokenRecord): CustomerRefreshToken {
    return CustomerRefreshToken.reconstitute({
      id: record.id,
      jti: record.jti,
      familyId: record.familyId,
      customerId: record.customerId,
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      replacedByJti: record.replacedByJti,
    });
  }
}
