import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import { CreateStockReservationUseCase } from '../../../inventory/application/use-cases/create-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import { InsufficientStockError } from '../../../inventory/domain/errors/inventory.errors';
import type { CreateOrderItemData } from '../../../orders/domain/repositories/order.repository';
import { OrderPolicy } from '../../../orders/domain/policies/order-policy';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_PROVIDER } from '../../../payments/domain/constants/payment-provider.constants';
import {
  PAYMENT_SESSION_REPOSITORY,
  type PaymentSessionRepository,
} from '../../../payments/domain/repositories/payment-session.repository';
import {
  PAYMENT_PROVIDER_REGISTRY,
  type PaymentProviderRegistry,
} from '../../../payments/domain/ports/payment-provider.port';
import { QuoteShippingRateUseCase } from '../../../shipping/application/use-cases/quote-shipping-rate.use-case';
import type { PendingOrderSnapshot } from '../../../payments/domain/entities/pending-order-snapshot';
import { EmptyCartError, ItemUnavailableAtCheckoutError } from '../../domain/errors/checkout.errors';

const CARD_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes — comfortably longer than a Stripe Checkout Session's own default expiry.

export interface InitiateCardCheckoutInput {
  guestToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingGovernorate: string;
  shippingCountry: string;
  shippingMethodId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface InitiateCardCheckoutResult {
  checkoutUrl: string | null;
  paymentSessionId: string;
}

/**
 * The CARD counterpart to `PlaceOrderUseCase` (ADR 0026) — reserves stock
 * and snapshots pricing exactly like COD's first three steps, but never
 * calls `OrderRepository.create()`. Per docs/product/07-ORDERS.md, "an
 * order only ever gets created once payment has actually succeeded" — so
 * everything needed to create it later is captured in a `PaymentSession`
 * instead, and a separate, later webhook request
 * (`ConfirmCardPaymentUseCase`) is what actually materializes the `Order`.
 *
 * Deliberately duplicates (rather than extracts/shares) `PlaceOrderUseCase`'s
 * reserve+snapshot logic — this epic's rule is "don't modify a frozen
 * module unless absolutely required," and refactoring `PlaceOrderUseCase`
 * to share code isn't required for this to work correctly.
 */
@Injectable()
export class InitiateCardCheckoutUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(PAYMENT_SESSION_REPOSITORY) private readonly paymentSessions: PaymentSessionRepository,
    @Inject(PAYMENT_PROVIDER_REGISTRY) private readonly providers: PaymentProviderRegistry,
    private readonly createStockReservation: CreateStockReservationUseCase,
    private readonly releaseStockReservation: ReleaseStockReservationUseCase,
    private readonly quoteShippingRate: QuoteShippingRateUseCase,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: InitiateCardCheckoutInput): Promise<InitiateCardCheckoutResult> {
    OrderPolicy.assertValidContactInfo({ name: input.customerName, email: input.customerEmail, phone: input.customerPhone });
    OrderPolicy.assertValidShippingAddress({
      fullName: input.shippingFullName,
      phone: input.shippingPhone,
      line1: input.shippingLine1,
      line2: input.shippingLine2,
      city: input.shippingCity,
      governorate: input.shippingGovernorate,
      country: input.shippingCountry,
    });

    const storeId = await this.storeContext.getCurrentStoreId();
    const cart = await this.carts.findOrCreateByToken(storeId, input.guestToken);
    if (cart.isEmpty) {
      throw new EmptyCartError();
    }

    const orderItems: CreateOrderItemData[] = [];
    const createdReservationIds: string[] = [];
    let subtotal = 0;
    let currencyCode = 'IQD';

    for (const item of cart.items) {
      const variant = await this.productVariants.findById(storeId, item.variantId);
      const product = variant ? await this.products.findById(storeId, variant.productId) : null;
      if (!variant || !product) {
        continue;
      }

      let reservationId: string;
      try {
        const reservation = await this.createStockReservation.execute({
          variantId: variant.id,
          cartId: cart.id,
          quantity: item.quantity,
        });
        reservationId = reservation.id;
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          await this.releaseAll(createdReservationIds);
          throw new ItemUnavailableAtCheckoutError(product.name, item.quantity);
        }
        throw error;
      }
      createdReservationIds.push(reservationId);

      const effectivePrice = variant.priceOverride ?? product.discountPrice ?? product.price;
      currencyCode = effectivePrice.currency;
      const unitPrice = effectivePrice.toNumber();
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;

      orderItems.push({
        variantId: variant.id,
        stockReservationId: reservationId,
        productNameSnapshot: product.name,
        skuSnapshot: variant.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const rateQuote = await this.quoteShippingRate.execute({
      governorate: input.shippingGovernorate,
      methodId: input.shippingMethodId,
      subtotal,
      discountTotal: 0,
    });
    const shippingFee = rateQuote.fee;
    const discountTotal = 0;
    const taxTotal = 0;
    const total = OrderPolicy.computeTotal({ subtotal, discountTotal, shippingFee, taxTotal });

    const pendingOrderSnapshot: PendingOrderSnapshot = {
      storeId,
      orderNumber: OrderPolicy.generateOrderNumber(),
      customerNameSnapshot: input.customerName,
      customerEmailSnapshot: input.customerEmail,
      customerPhoneSnapshot: input.customerPhone,
      shippingFullName: input.shippingFullName,
      shippingPhone: input.shippingPhone,
      shippingLine1: input.shippingLine1,
      shippingLine2: input.shippingLine2 ?? null,
      shippingCity: input.shippingCity,
      shippingGovernorate: input.shippingGovernorate,
      shippingCountry: input.shippingCountry,
      shippingMethodId: input.shippingMethodId,
      subtotal,
      discountTotal,
      shippingFee,
      taxTotal,
      total,
      currencyCode,
      paymentMethod: PAYMENT_METHOD.CARD,
      items: orderItems,
      cartId: cart.id,
      reservationIds: createdReservationIds,
    };

    const provider = this.providers.get(PAYMENT_PROVIDER.STRIPE);
    if (!provider) {
      throw new Error('No Stripe provider registered.');
    }

    const session = await this.paymentSessions.create({
      storeId,
      provider: PAYMENT_PROVIDER.STRIPE,
      pendingOrderSnapshot,
      amount: total,
      currencyCode,
      expiresAt: new Date(Date.now() + CARD_SESSION_TTL_MS),
    });

    const providerSession = await provider.createSession({
      amount: total,
      currencyCode,
      orderNumber: pendingOrderSnapshot.orderNumber,
      customerEmail: input.customerEmail,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    return { checkoutUrl: providerSession.checkoutUrl, paymentSessionId: session.id };
  }

  private async releaseAll(reservationIds: string[]): Promise<void> {
    for (const reservationId of reservationIds) {
      await this.releaseStockReservation.execute({ reservationId });
    }
  }
}
