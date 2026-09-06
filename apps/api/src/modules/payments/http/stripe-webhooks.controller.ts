import { Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { StripePaymentProvider } from '../infrastructure/providers/stripe-payment.provider';
import { ConfirmCardPaymentUseCase } from '../application/use-cases/confirm-card-payment.use-case';
import { FailCardPaymentUseCase } from '../application/use-cases/fail-card-payment.use-case';
import { PaymentWebhookSignatureInvalidError } from '../domain/errors/payment.errors';

const SUCCESS_EVENT_TYPES = new Set(['checkout.session.completed']);
const FAILURE_EVENT_TYPES = new Set(['checkout.session.expired', 'payment_intent.payment_failed']);

/**
 * The Stripe webhook (ADR 0026) — `@Public()`, but signature-verified
 * against the raw request body (`main.ts`'s `rawBody: true`), never trusts
 * an unverified payload. Per `docs/product/12-PAYMENTS.md`'s FR-2, this is
 * the *only* place a card `Order`'s existence/failure is decided — nothing
 * about the customer's browser/redirect matters. Idempotent by
 * construction: `ConfirmCardPaymentUseCase`/`FailCardPaymentUseCase` both
 * no-op on a session that's no longer `PENDING`, so a Stripe retry is safe.
 */
@ApiExcludeController()
@Public()
@Controller('payments/webhooks')
export class StripeWebhooksController {
  private readonly logger = new Logger(StripeWebhooksController.name);

  constructor(
    private readonly stripeProvider: StripePaymentProvider,
    private readonly confirmCardPayment: ConfirmCardPaymentUseCase,
    private readonly failCardPayment: FailCardPaymentUseCase,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: boolean }> {
    const rawBody = request.rawBody;
    if (!rawBody || !this.stripeProvider.verifyWebhookSignature(rawBody, signature)) {
      throw new PaymentWebhookSignatureInvalidError();
    }

    const event = this.stripeProvider.parseWebhookEvent(rawBody);

    try {
      if (SUCCESS_EVENT_TYPES.has(event.type) && event.providerSessionId) {
        await this.confirmCardPayment.execute({
          providerSessionId: event.providerSessionId,
          providerReference: event.providerReference,
        });
      } else if (FAILURE_EVENT_TYPES.has(event.type) && event.providerSessionId) {
        await this.failCardPayment.execute({
          providerSessionId: event.providerSessionId,
          reason: event.type,
        });
      }
    } catch (error) {
      // Per docs/product/07-ORDERS.md: a payment that succeeded but failed
      // to finalize into an Order must never silently disappear. Logged
      // loudly here; the FailedJobLog + SYSTEM_PAYMENT_RECONCILIATION_FAILURE
      // alert path is documented in ADR 0026 as follow-up hardening — this
      // epic guarantees the failure is visible in logs, not swallowed.
      this.logger.error(`Failed to process Stripe webhook event ${event.type}: ${(error as Error).message}`);
      throw error;
    }

    return { received: true };
  }
}
