import type { PhoneVerificationCode as PhoneVerificationCodeRecord } from '@prisma/client';
import { PhoneVerificationCode } from '../../domain/entities/phone-verification-code.entity';

export class PhoneVerificationCodeMapper {
  static toDomain(
    this: void,
    record: PhoneVerificationCodeRecord,
  ): PhoneVerificationCode {
    return PhoneVerificationCode.reconstitute({
      id: record.id,
      phone: record.phone,
      codeHash: record.codeHash,
      attempts: record.attempts,
      expiresAt: record.expiresAt,
      verifiedAt: record.verifiedAt,
      consumedAt: record.consumedAt,
      createdAt: record.createdAt,
    });
  }
}
