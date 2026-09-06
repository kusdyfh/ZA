import type { PasswordResetToken as PasswordResetTokenRecord } from '@prisma/client';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

export class PasswordResetTokenMapper {
  static toDomain(this: void, record: PasswordResetTokenRecord): PasswordResetToken {
    return PasswordResetToken.reconstitute({
      id: record.id,
      tokenHash: record.tokenHash,
      adminUserId: record.adminUserId,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    });
  }
}
