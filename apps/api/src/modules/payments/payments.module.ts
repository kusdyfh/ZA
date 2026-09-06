import { Module } from '@nestjs/common';
import { PAYMENT_SESSION_REPOSITORY } from './domain/repositories/payment-session.repository';
import { PrismaPaymentSessionRepository } from './infrastructure/repositories/prisma-payment-session.repository';
import { PAYMENT_TRANSACTION_REPOSITORY } from './domain/repositories/payment-transaction.repository';
import { PrismaPaymentTransactionRepository } from './infrastructure/repositories/prisma-payment-transaction.repository';
import { PAYMENT_STATUS_HISTORY_REPOSITORY } from './domain/repositories/payment-status-history.repository';
import { PrismaPaymentStatusHistoryRepository } from './infrastructure/repositories/prisma-payment-status-history.repository';
import { REFUND_REPOSITORY } from './domain/repositories/refund.repository';
import { PrismaRefundRepository } from './infrastructure/repositories/prisma-refund.repository';
import { CodPaymentProvider } from './infrastructure/providers/cod-payment.provider';
import { StripePaymentProvider } from './infrastructure/providers/stripe-payment.provider';
import { ManualPaymentProvider } from './infrastructure/providers/manual-payment.provider';
import {
  PAYMENT_PROVIDER_REGISTRY,
  type PaymentProviderPort,
  type PaymentProviderRegistry,
} from './domain/ports/payment-provider.port';
import { PAYMENT_PROVIDER, type PaymentProviderValue } from './domain/constants/payment-provider.constants';
import { ConfirmCardPaymentUseCase } from './application/use-cases/confirm-card-payment.use-case';
import { FailCardPaymentUseCase } from './application/use-cases/fail-card-payment.use-case';
import { VerifyManualPaymentUseCase } from './application/use-cases/verify-manual-payment.use-case';
import { IssueRefundUseCase } from './application/use-cases/issue-refund.use-case';
import { GetOrderPaymentSummaryUseCase } from './application/use-cases/get-order-payment-summary.use-case';
import { PaymentsController } from './http/payments.controller';
import { StripeWebhooksController } from './http/stripe-webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { ShippingModule } from '../shipping/shipping.module';
import { InventoryModule } from '../inventory/inventory.module';

/**
 * HTTP-facing Payments (ADR 0026) — admin refund/manual-verification
 * actions, the Stripe webhook, and payment-summary reads. Imports
 * `OrdersModule` (`ORDER_REPOSITORY`, for materializing/updating Orders),
 * `ShippingModule` (`SHIPMENT_REPOSITORY`, to create the Shipment
 * alongside a card order), and `InventoryModule` (reservation confirm/
 * release on payment success/failure).
 */
@Module({
  imports: [OrdersModule, ShippingModule, InventoryModule],
  controllers: [PaymentsController, StripeWebhooksController],
  providers: [
    { provide: PAYMENT_SESSION_REPOSITORY, useClass: PrismaPaymentSessionRepository },
    { provide: PAYMENT_TRANSACTION_REPOSITORY, useClass: PrismaPaymentTransactionRepository },
    { provide: PAYMENT_STATUS_HISTORY_REPOSITORY, useClass: PrismaPaymentStatusHistoryRepository },
    { provide: REFUND_REPOSITORY, useClass: PrismaRefundRepository },
    CodPaymentProvider,
    StripePaymentProvider,
    ManualPaymentProvider,
    {
      provide: PAYMENT_PROVIDER_REGISTRY,
      useFactory: (cod: CodPaymentProvider, stripe: StripePaymentProvider, manual: ManualPaymentProvider): PaymentProviderRegistry =>
        new Map<PaymentProviderValue, PaymentProviderPort>([
          [PAYMENT_PROVIDER.COD, cod],
          [PAYMENT_PROVIDER.STRIPE, stripe],
          [PAYMENT_PROVIDER.MANUAL, manual],
        ]),
      inject: [CodPaymentProvider, StripePaymentProvider, ManualPaymentProvider],
    },
    ConfirmCardPaymentUseCase,
    FailCardPaymentUseCase,
    VerifyManualPaymentUseCase,
    IssueRefundUseCase,
    GetOrderPaymentSummaryUseCase,
  ],
  exports: [
    PAYMENT_SESSION_REPOSITORY,
    PAYMENT_TRANSACTION_REPOSITORY,
    PAYMENT_STATUS_HISTORY_REPOSITORY,
    REFUND_REPOSITORY,
    PAYMENT_PROVIDER_REGISTRY,
    ConfirmCardPaymentUseCase,
    FailCardPaymentUseCase,
  ],
})
export class PaymentsModule {}
