import type { RequestPhoneVerificationResult } from '../use-cases/request-phone-verification.use-case';
import type { ConfirmPhoneVerificationResult } from '../use-cases/confirm-phone-verification.use-case';

export class RequestPhoneVerificationResponseDto {
  phone!: string;
  expiresInSeconds!: number;
  /** Only present outside production — see `RequestPhoneVerificationUseCase.revealCode`. */
  code?: string;

  static fromResult(
    this: void,
    result: RequestPhoneVerificationResult,
  ): RequestPhoneVerificationResponseDto {
    const dto = new RequestPhoneVerificationResponseDto();
    dto.phone = result.phone;
    dto.expiresInSeconds = result.expiresInSeconds;
    dto.code = result.code;
    return dto;
  }
}

export class ConfirmPhoneVerificationResponseDto {
  phone!: string;
  verified = true as const;

  static fromResult(
    this: void,
    result: ConfirmPhoneVerificationResult,
  ): ConfirmPhoneVerificationResponseDto {
    const dto = new ConfirmPhoneVerificationResponseDto();
    dto.phone = result.phone;
    return dto;
  }
}
