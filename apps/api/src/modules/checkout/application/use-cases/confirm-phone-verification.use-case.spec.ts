import { createHash } from 'node:crypto';
import { ConfirmPhoneVerificationUseCase } from './confirm-phone-verification.use-case';
import type { PhoneVerificationCodeRepository } from '../../domain/repositories/phone-verification-code.repository';
import { PhoneVerificationCode } from '../../domain/entities/phone-verification-code.entity';
import {
  InvalidPhoneNumberError,
  InvalidVerificationCodeError,
  TooManyVerificationAttemptsError,
  VerificationCodeExpiredError,
} from '../../domain/errors/checkout.errors';

function hash(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function buildCode(
  overrides: Partial<
    Parameters<typeof PhoneVerificationCode.reconstitute>[0]
  > = {},
) {
  return PhoneVerificationCode.reconstitute({
    id: 'code-1',
    phone: '+9647700000000',
    codeHash: hash('123456'),
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    verifiedAt: null,
    consumedAt: null,
    createdAt: new Date(),
    ...overrides,
  });
}

describe('ConfirmPhoneVerificationUseCase', () => {
  let codes: jest.Mocked<PhoneVerificationCodeRepository>;
  let useCase: ConfirmPhoneVerificationUseCase;

  beforeEach(() => {
    codes = {
      create: jest.fn(),
      findLatestByPhone: jest.fn(),
      save: jest.fn(),
    };
    useCase = new ConfirmPhoneVerificationUseCase(codes);
  });

  it('throws InvalidPhoneNumberError for a malformed number', async () => {
    await expect(
      useCase.execute({ phone: '123', code: '123456' }),
    ).rejects.toThrow(InvalidPhoneNumberError);
  });

  it('throws InvalidVerificationCodeError when no code was ever requested for this phone', async () => {
    codes.findLatestByPhone.mockResolvedValue(null);

    await expect(
      useCase.execute({ phone: '+9647700000000', code: '123456' }),
    ).rejects.toThrow(InvalidVerificationCodeError);
  });

  it('marks the code verified on a correct match', async () => {
    const code = buildCode();
    codes.findLatestByPhone.mockResolvedValue(code);

    const result = await useCase.execute({
      phone: '+9647700000000',
      code: '123456',
    });

    expect(result.phone).toBe('+9647700000000');
    expect(code.isVerified()).toBe(true);
    expect(codes.save).toHaveBeenCalledWith(code);
  });

  it('records a failed attempt and throws on a wrong code', async () => {
    const code = buildCode();
    codes.findLatestByPhone.mockResolvedValue(code);

    await expect(
      useCase.execute({ phone: '+9647700000000', code: '000000' }),
    ).rejects.toThrow(InvalidVerificationCodeError);
    expect(code.toProps().attempts).toBe(1);
    expect(code.isVerified()).toBe(false);
  });

  it('throws VerificationCodeExpiredError for an expired code', async () => {
    codes.findLatestByPhone.mockResolvedValue(
      buildCode({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      useCase.execute({ phone: '+9647700000000', code: '123456' }),
    ).rejects.toThrow(VerificationCodeExpiredError);
  });

  it('throws TooManyVerificationAttemptsError after too many wrong guesses', async () => {
    codes.findLatestByPhone.mockResolvedValue(buildCode({ attempts: 5 }));

    await expect(
      useCase.execute({ phone: '+9647700000000', code: '123456' }),
    ).rejects.toThrow(TooManyVerificationAttemptsError);
  });

  it('throws InvalidVerificationCodeError when the code was already consumed by a prior order', async () => {
    codes.findLatestByPhone.mockResolvedValue(
      buildCode({ consumedAt: new Date() }),
    );

    await expect(
      useCase.execute({ phone: '+9647700000000', code: '123456' }),
    ).rejects.toThrow(InvalidVerificationCodeError);
  });
});
