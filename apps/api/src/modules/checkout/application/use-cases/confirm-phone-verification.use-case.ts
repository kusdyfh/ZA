import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { normalizeIraqiPhone } from '@za/shared';
import {
  PHONE_VERIFICATION_CODE_REPOSITORY,
  type PhoneVerificationCodeRepository,
} from '../../domain/repositories/phone-verification-code.repository';
import {
  InvalidPhoneNumberError,
  InvalidVerificationCodeError,
  TooManyVerificationAttemptsError,
  VerificationCodeExpiredError,
} from '../../domain/errors/checkout.errors';

export interface ConfirmPhoneVerificationInput {
  phone: string;
  code: string;
}

export interface ConfirmPhoneVerificationResult {
  phone: string;
}

/** Confirms the code sent by `RequestPhoneVerificationUseCase`, marking the phone verified for `PlaceOrderUseCase` to accept. */
@Injectable()
export class ConfirmPhoneVerificationUseCase {
  constructor(
    @Inject(PHONE_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: PhoneVerificationCodeRepository,
  ) {}

  async execute(
    input: ConfirmPhoneVerificationInput,
  ): Promise<ConfirmPhoneVerificationResult> {
    const phone = normalizeIraqiPhone(input.phone);
    if (!phone) {
      throw new InvalidPhoneNumberError();
    }

    const record = await this.codes.findLatestByPhone(phone);
    if (!record) {
      throw new InvalidVerificationCodeError();
    }
    if (record.isConsumed()) {
      throw new InvalidVerificationCodeError();
    }
    if (record.hasTooManyAttempts()) {
      throw new TooManyVerificationAttemptsError();
    }
    if (record.isExpired()) {
      throw new VerificationCodeExpiredError();
    }

    const codeHash = createHash('sha256')
      .update(input.code.trim())
      .digest('hex');
    if (codeHash !== record.codeHash) {
      record.recordFailedAttempt();
      await this.codes.save(record);
      throw record.hasTooManyAttempts()
        ? new TooManyVerificationAttemptsError()
        : new InvalidVerificationCodeError();
    }

    record.markVerified();
    await this.codes.save(record);

    return { phone };
  }
}
