import type { RefreshToken as RefreshTokenRecord } from '@prisma/client';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

export class RefreshTokenMapper {
  static toDomain(this: void, record: RefreshTokenRecord): RefreshToken {
    return RefreshToken.reconstitute({
      id: record.id,
      jti: record.jti,
      familyId: record.familyId,
      adminUserId: record.adminUserId,
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      replacedByJti: record.replacedByJti,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
    });
  }
}
