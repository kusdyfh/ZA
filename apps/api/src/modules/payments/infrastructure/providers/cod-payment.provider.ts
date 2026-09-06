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
 * COD never redirects — checkout proceeds synchronously, exactly today's
 * flow (ADR 0026). `refund()` always requires manual follow-up: there is
 * no electronic transaction to reverse (docs/product/12-PAYMENTS.md).
 */
@Injectable()
export class CodPaymentProvider implements PaymentProviderPort {
  readonly provider = PAYMENT_PROVIDER.COD;

  createSession(_input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult> {
    return Promise.resolve({ requiresRedirect: false, checkoutUrl: null, providerSessionId: null });
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  parseWebhookEvent(): PaymentWebhookEvent {
    throw new Error('COD has no webhooks.');
  }

  refund(_input: RefundInput): Promise<RefundResult> {
    return Promise.resolve({ succeeded: true, providerReference: null, requiresManualFollowUp: true });
  }
}
