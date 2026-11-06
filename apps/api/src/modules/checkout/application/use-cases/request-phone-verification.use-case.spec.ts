import { RequestPhoneVerificationUseCase } from './request-phone-verification.use-case';
import type { PhoneVerificationCodeRepository } from '../../domain/repositories/phone-verification-code.repository';
import type { WhatsAppProvider } from '../../domain/ports/whatsapp-provider.port';
import { PhoneVerificationCode } from '../../domain/entities/phone-verification-code.entity';
import {
  InvalidPhoneNumberError,
  VerificationCodeRequestTooSoonError,
} from '../../domain/errors/checkout.errors';

function buildCode(
  overrides: Partial<
    Parameters<typeof PhoneVerificationCode.reconstitute>[0]
  > = {},
) {
  return PhoneVerificationCode.reconstitute({
    id: 'code-1',
    phone: '+9647700000000',
    codeHash: 'hash',
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    verifiedAt: null,
    consumedAt: null,
    createdAt: new Date(),
    ...overrides,
  });
}

describe('RequestPhoneVerificationUseCase', () => {
  let codes: jest.Mocked<PhoneVerificationCodeRepository>;
  let whatsapp: jest.Mocked<WhatsAppProvider>;
  let useCase: RequestPhoneVerificationUseCase;

  beforeEach(() => {
    codes = {
      create: jest.fn(),
      findLatestByPhone: jest.fn(),
      save: jest.fn(),
    };
    whatsapp = { sendVerificationCode: jest.fn() };
    useCase = new RequestPhoneVerificationUseCase(codes, whatsapp);
  });

  it('throws InvalidPhoneNumberError for a non-Iraqi/malformed number', async () => {
    await expect(
      useCase.execute({ phone: '123', revealCode: false }),
    ).rejects.toThrow(InvalidPhoneNumberError);
    expect(codes.create).not.toHaveBeenCalled();
  });

  it('normalizes the phone, creates a code, and sends it over WhatsApp', async () => {
    codes.findLatestByPhone.mockResolvedValue(null);
    codes.create.mockResolvedValue(buildCode());

    const result = await useCase.execute({
      phone: '07700000000',
      revealCode: false,
    });

    expect(codes.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+9647700000000' }),
    );
    expect(whatsapp.sendVerificationCode).toHaveBeenCalledWith(
      '+9647700000000',
      expect.stringMatching(/^\d{6}$/),
    );
    expect(result.phone).toBe('+9647700000000');
    expect(result.code).toBeUndefined();
  });

  it('reveals the raw code only when asked (dev/test convenience, never production)', async () => {
    codes.findLatestByPhone.mockResolvedValue(null);
    codes.create.mockResolvedValue(buildCode());

    const result = await useCase.execute({
      phone: '+9647700000000',
      revealCode: true,
    });

    expect(result.code).toMatch(/^\d{6}$/);
  });

  it('rejects a resend within the cooldown window', async () => {
    codes.findLatestByPhone.mockResolvedValue(
      buildCode({ createdAt: new Date() }),
    );

    await expect(
      useCase.execute({ phone: '+9647700000000', revealCode: false }),
    ).rejects.toThrow(VerificationCodeRequestTooSoonError);
    expect(codes.create).not.toHaveBeenCalled();
  });

  it('allows a resend once the cooldown has passed', async () => {
    codes.findLatestByPhone.mockResolvedValue(
      buildCode({ createdAt: new Date(Date.now() - 61_000) }),
    );
    codes.create.mockResolvedValue(buildCode());

    await useCase.execute({ phone: '+9647700000000', revealCode: false });

    expect(codes.create).toHaveBeenCalledTimes(1);
  });
});
