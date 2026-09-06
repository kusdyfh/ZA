import { Injectable } from '@nestjs/common';
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentProviderPort,
  PaymentWebhookEvent,
  RefundInput,
  RefundResult,
} from '../../domain/ports/payment-provider.port';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';

/**
 * Backs "Manual Payment Verification" (ADR 0026) — staff attest a payment
 * was received out-of-band (COD cash collected, a bank transfer
 * reference confirmed); there is no gateway to call or poll. Never
 * redirects, never has webhooks. `VerifyManualPaymentUseCase` is the real
 * entry point for COD; this provider exists so the abstraction covers
 * every `PaymentProvider` enum value, ready for a future manual method
 * (e.g. bank transfer) needing its own `createSession()` behavior.
 */
@Injectable()
export class ManualPaymentProvider implements PaymentProviderPort {
  readonly provider = PAYMENT_PROVIDER.MANUAL;

  createSession(_input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult> {
    return Promise.resolve({ requiresRedirect: false, checkoutUrl: null, providerSessionId: null });
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  parseWebhookEvent(): PaymentWebhookEvent {
    throw new Error('Manual payments have no webhooks.');
  }

  refund(_input: RefundInput): Promise<RefundResult> {
    return Promise.resolve({ succeeded: true, providerReference: null, requiresManualFollowUp: true });
  }
}
