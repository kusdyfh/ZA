import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';
import { ShippingModule } from '../shipping/shipping.module';
import { PaymentsModule } from '../payments/payments.module';
import { CART_REPOSITORY } from './domain/repositories/cart.repository';
import { PrismaCartRepository } from './infrastructure/repositories/prisma-cart.repository';
import { PHONE_VERIFICATION_CODE_REPOSITORY } from './domain/repositories/phone-verification-code.repository';
import { PrismaPhoneVerificationCodeRepository } from './infrastructure/repositories/prisma-phone-verification-code.repository';
import { WHATSAPP_PROVIDER } from './domain/ports/whatsapp-provider.port';
import { MockWhatsAppProvider } from './infrastructure/providers/mock-whatsapp.provider';

import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { UpdateCartItemQuantityUseCase } from './application/use-cases/update-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { PlaceOrderUseCase } from './application/use-cases/place-order.use-case';
import { InitiateCardCheckoutUseCase } from './application/use-cases/initiate-card-checkout.use-case';
import { RequestPhoneVerificationUseCase } from './application/use-cases/request-phone-verification.use-case';
import { ConfirmPhoneVerificationUseCase } from './application/use-cases/confirm-phone-verification.use-case';
import { CartController } from './http/cart.controller';
import { CheckoutController } from './http/checkout.controller';

/**
 * The Cart→Order orchestration (docs/06-DDD-BOUNDED-CONTEXTS.md's
 * "Checkout" — a process context, not primarily a data owner beyond
 * Cart/CartItem). Imports CatalogModule (pricing/name snapshot),
 * InventoryModule (stock reservation), and OrdersModule (order
 * creation) — per docs/v2/adr/0015, this is intentionally the
 * most-connected module in the codebase, holding no long-lived state of
 * its own beyond the cart. Epic 6 (API Layer) adds two fully-public
 * controllers here (Cart, Checkout submission) — no admin identity is
 * ever required to buy.
 *
 * Epic 12 (ADR 0026/0027) adds `ShippingModule` (rate quoting, both COD
 * and CARD checkout need it before totals can be computed) and
 * `PaymentsModule` (`InitiateCardCheckoutUseCase` needs the payment
 * session repository + provider registry for the CARD path).
 */
const REPOSITORY_PROVIDERS = [
  { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
  {
    provide: PHONE_VERIFICATION_CODE_REPOSITORY,
    useClass: PrismaPhoneVerificationCodeRepository,
  },
];

// Swap MockWhatsAppProvider for a real account (Meta Cloud API/Twilio/etc.)
// here once one exists — nothing else in this module changes.
const PROVIDER_PROVIDERS = [
  { provide: WHATSAPP_PROVIDER, useClass: MockWhatsAppProvider },
];

const USE_CASE_PROVIDERS = [
  AddCartItemUseCase,
  UpdateCartItemQuantityUseCase,
  RemoveCartItemUseCase,
  GetCartUseCase,
  PlaceOrderUseCase,
  InitiateCardCheckoutUseCase,
  RequestPhoneVerificationUseCase,
  ConfirmPhoneVerificationUseCase,
];

@Module({
  imports: [
    CatalogModule,
    InventoryModule,
    OrdersModule,
    ShippingModule,
    PaymentsModule,
  ],
  controllers: [CartController, CheckoutController],
  providers: [
    ...REPOSITORY_PROVIDERS,
    ...PROVIDER_PROVIDERS,
    ...USE_CASE_PROVIDERS,
  ],
  // CART_REPOSITORY is exported (in addition to use-cases) so
  // CustomersModule's MergeGuestCartUseCase (Epic 8) can move a guest
  // cart's items into a customer's own persistent cart — the same
  // additive-export precedent as every prior epic (e.g. Catalog's
  // PRODUCT_REPOSITORY).
  exports: [...USE_CASE_PROVIDERS, CART_REPOSITORY],
})
export class CheckoutModule {}
