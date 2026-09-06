import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { AppConfig } from '../../../../shared/config/configuration';
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentProviderPort,
  PaymentWebhookEvent,
  RefundInput,
  RefundResult,
} from '../../domain/ports/payment-provider.port';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';

/** Stripe Checkout Sessions + webhook signature verification (ADR 0026). */
@Injectable()
export class StripePaymentProvider implements PaymentProviderPort {
  readonly provider = PAYMENT_PROVIDER.STRIPE;

  private readonly client: Stripe;
  private readonly webhookSecret: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const appConfig = config.getOrThrow<AppConfig>('app');
    this.client = new Stripe(appConfig.stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
    this.webhookSecret = appConfig.stripeWebhookSecret;
  }

  async createSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult> {
    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: input.currencyCode.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: { name: `Order ${input.orderNumber}` },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { requiresRedirect: true, checkoutUrl: session.url, providerSessionId: session.id };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) {
      return false;
    }
    try {
      this.client.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(rawBody: Buffer): PaymentWebhookEvent {
    // Signature already verified by verifyWebhookSignature — parse without re-verifying, matching the controller's own two-step call order.
    const event = JSON.parse(rawBody.toString('utf8')) as Stripe.Event;
    const object = event.data.object as { id?: string; payment_intent?: string; amount_total?: number | null };

    return {
      type: event.type,
      providerSessionId: object.id ?? null,
      providerReference: typeof object.payment_intent === 'string' ? object.payment_intent : null,
      amount: typeof object.amount_total === 'number' ? object.amount_total / 100 : null,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const refund = await this.client.refunds.create({
        payment_intent: input.providerReference,
        amount: Math.round(input.amount * 100),
      });
      return { succeeded: true, providerReference: refund.id, requiresManualFollowUp: false };
    } catch {
      return { succeeded: false, providerReference: null, requiresManualFollowUp: true };
    }
  }
}
