import { createHash, randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { normalizeIraqiPhone } from '@za/shared';
import {
  PHONE_VERIFICATION_CODE_REPOSITORY,
  type PhoneVerificationCodeRepository,
} from '../../domain/repositories/phone-verification-code.repository';
import {
  WHATSAPP_PROVIDER,
  type WhatsAppProvider,
} from '../../domain/ports/whatsapp-provider.port';
import {
  InvalidPhoneNumberError,
  VerificationCodeRequestTooSoonError,
} from '../../domain/errors/checkout.errors';

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export interface RequestPhoneVerificationInput {
  phone: string;
  /**
   * Decided by the controller from `NODE_ENV`, not read from `process.env`
   * here — same convention as `RequestPasswordResetUseCase.revealToken`.
   * The raw code is only ever returned outside production, as a stand-in
   * until a real WhatsApp account replaces `MockWhatsAppProvider`.
   */
  revealCode: boolean;
}

export interface RequestPhoneVerificationResult {
  phone: string;
  expiresInSeconds: number;
  code?: string;
}

/**
 * Starts (or restarts) WhatsApp phone verification for the checkout
 * contact number (product decision — phone is required and verified
 * before an order can be placed). A plain 6-digit code, 10-minute expiry,
 * one resend per 60 seconds per phone to limit spam toward a real
 * WhatsApp account/number later.
 */
@Injectable()
export class RequestPhoneVerificationUseCase {
  constructor(
    @Inject(PHONE_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: PhoneVerificationCodeRepository,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsAppProvider,
  ) {}

  async execute(
    input: RequestPhoneVerificationInput,
  ): Promise<RequestPhoneVerificationResult> {
    const phone = normalizeIraqiPhone(input.phone);
    if (!phone) {
      throw new InvalidPhoneNumberError();
    }

    const existing = await this.codes.findLatestByPhone(phone);
    if (existing) {
      const secondsSinceLastRequest =
        (Date.now() - existing.toProps().createdAt.getTime()) / 1000;
      if (secondsSinceLastRequest < RESEND_COOLDOWN_SECONDS) {
        throw new VerificationCodeRequestTooSoonError();
      }
    }

    const code = randomInt(100_000, 1_000_000).toString();
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

    await this.codes.create({ phone, codeHash, expiresAt });
    await this.whatsapp.sendVerificationCode(phone, code);

    return {
      phone,
      expiresInSeconds: CODE_TTL_MINUTES * 60,
      ...(input.revealCode ? { code } : {}),
    };
  }
}
