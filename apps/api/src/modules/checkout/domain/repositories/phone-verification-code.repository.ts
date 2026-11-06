import type { PhoneVerificationCode } from '../entities/phone-verification-code.entity';

export const PHONE_VERIFICATION_CODE_REPOSITORY = Symbol(
  'PHONE_VERIFICATION_CODE_REPOSITORY',
);

export interface CreatePhoneVerificationCodeData {
  phone: string;
  codeHash: string;
  expiresAt: Date;
}

export interface PhoneVerificationCodeRepository {
  create(data: CreatePhoneVerificationCodeData): Promise<PhoneVerificationCode>;
  /** Most recently created code for this phone, regardless of state — callers decide what "usable" means. */
  findLatestByPhone(phone: string): Promise<PhoneVerificationCode | null>;
  save(code: PhoneVerificationCode): Promise<void>;
}
