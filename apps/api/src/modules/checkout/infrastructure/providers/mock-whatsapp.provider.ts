import { Injectable, Logger } from '@nestjs/common';
import type { WhatsAppProvider } from '../../domain/ports/whatsapp-provider.port';

/**
 * Stand-in until a real WhatsApp account (Meta Cloud API / Twilio /
 * other) is set up — logs the code instead of sending it, the same role
 * Mailpit plays for email in dev. `RequestPhoneVerificationUseCase`
 * additionally returns the raw code in the API response outside
 * production (mirrors `RequestPasswordResetUseCase`'s `revealToken`),
 * so this log line is a convenience, not the only way to see the code.
 */
@Injectable()
export class MockWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  sendVerificationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`[MOCK WHATSAPP] Verification code for ${phone}: ${code}`);
    return Promise.resolve();
  }
}
