import { Inject, Injectable } from '@nestjs/common';
import { ActorType } from '@za/types';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CART_REPOSITORY, type CartRepository } from '../../domain/repositories/cart.repository';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../../catalog/domain/repositories/product-variant.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import { CreateStockReservationUseCase } from '../../../inventory/application/use-cases/create-stock-reservation.use-case';
import { ConfirmStockReservationUseCase } from '../../../inventory/application/use-cases/confirm-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import { InsufficientStockError } from '../../../inventory/domain/errors/inventory.errors';
import {
  ORDER_REPOSITORY,
  type CreateOrderItemData,
  type OrderRepository,
} from '../../../orders/domain/repositories/order.repository';
import { Order } from '../../../orders/domain/entities/order.entity';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import type { PaymentMethodValue } from '../../../orders/domain/constants/payment-method.constants';
import { OrderPolicy } from '../../../orders/domain/policies/order-policy';
import { QuoteShippingRateUseCase } from '../../../shipping/application/use-cases/quote-shipping-rate.use-case';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../../shipping/domain/repositories/shipment.repository';
import { EmptyCartError, ItemUnavailableAtCheckoutError } from '../../domain/errors/checkout.errors';

export interface PlaceOrderInput {
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
  paymentMethod: PaymentMethodValue;
}

const SYSTEM_ACTOR = { actorId: null, actorType: ActorType.SYSTEM };

/**
 * The Cart→Order orchestration (docs/06-DDD-BOUNDED-CONTEXTS.md's
 * "Checkout" saga). Per docs/v2/adr/0015:
 *
 * 1. Validate contact info, shipping address, and payment method
 *    (`OrderPolicy`) — all required before an order can be placed
 *    (docs/product/08-CHECKOUT.md).
 * 2. Reserve stock per cart item (`CreateStockReservationUseCase`) —
 *    server-verified, never trusting the cart page's displayed
 *    availability. Any item that can't be reserved releases every
 *    reservation already created in this attempt (compensating action)
 *    and surfaces exactly which item is affected.
 * 3. Snapshot pricing/name/SKU from Catalog's *current* state (never the
 *    cart's possibly-stale view) and create the `Order` (PENDING, with
 *    its first timeline row) in one transaction.
 * 4. Only `COD` is processable end-to-end this epic — auto-confirm
 *    immediately: confirm every reservation (decrementing real stock via
 *    a SALE movement) and transition the order to `CONFIRMED`,
 *    mirroring docs/product/07-ORDERS.md's "brief automatic step."
 * 5. Clear the cart.
 */
@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly productVariants: ProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly createStockReservation: CreateStockReservationUseCase,
    private readonly confirmStockReservation: ConfirmStockReservationUseCase,
    private readonly releaseStockReservation: ReleaseStockReservationUseCase,
    private readonly quoteShippingRate: QuoteShippingRateUseCase,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: PlaceOrderInput): Promise<Order> {
    OrderPolicy.assertSupportedPaymentMethod(input.paymentMethod);
    OrderPolicy.assertValidContactInfo({
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
    });
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

    const discountTotal = 0;
    const taxTotal = 0;
    // Epic 12 (ADR 0027) — replaces the old hardcoded STANDARD_SHIPPING_FEE
    // constant with a real rate lookup; also enforces "checkout blocks
    // addresses outside supported delivery regions" (docs/product
    // /11-SHIPPING.md) before any reservation/order write happens.
    const rateQuote = await this.quoteShippingRate.execute({
      governorate: input.shippingGovernorate,
      methodId: input.shippingMethodId,
      subtotal,
      discountTotal,
    });
    const shippingFee = rateQuote.fee;
    const total = OrderPolicy.computeTotal({ subtotal, discountTotal, shippingFee, taxTotal });

    let order = await this.orders.create({
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
      paymentMethod: input.paymentMethod,
      items: orderItems,
    });

    // Only COD reaches here (assertSupportedPaymentMethod still rejects an
    // unrecognized method, but CARD now goes through
    // InitiateCardCheckoutUseCase instead of this use-case entirely) — "a
    // brief automatic step" per docs/product/07-ORDERS.md. paymentStatus
    // is AWAITING_COLLECTION, not PAID (Epic 12, ADR 0026) — cash isn't
    // actually collected until delivery; VerifyManualPaymentUseCase closes
    // that gap.
    for (const reservationId of createdReservationIds) {
      await this.confirmStockReservation.execute({ reservationId, actor: SYSTEM_ACTOR });
    }
    order = await this.orders.changeStatus(
      order.id,
      ORDER_STATUS.CONFIRMED,
      'Order confirmed (Cash on Delivery).',
      SYSTEM_ACTOR,
      { paymentStatus: PAYMENT_STATUS.AWAITING_COLLECTION },
    );

    await this.shipments.create({ storeId, orderId: order.id, shippingMethodId: input.shippingMethodId });

    await this.carts.clear(cart.id);

    return order;
  }

  private async releaseAll(reservationIds: string[]): Promise<void> {
    for (const reservationId of reservationIds) {
      await this.releaseStockReservation.execute({ reservationId });
    }
  }
}
