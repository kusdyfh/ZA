import { ActorType } from '@za/types';
import { PlaceOrderUseCase, type PlaceOrderInput } from './place-order.use-case';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { ProductVariantRepository } from '../../../catalog/domain/repositories/product-variant.repository';
import type { ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import type { OrderRepository } from '../../../orders/domain/repositories/order.repository';
import type { CreateStockReservationUseCase } from '../../../inventory/application/use-cases/create-stock-reservation.use-case';
import type { ConfirmStockReservationUseCase } from '../../../inventory/application/use-cases/confirm-stock-reservation.use-case';
import type { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import type { ShipmentRepository } from '../../../shipping/domain/repositories/shipment.repository';
import type { QuoteShippingRateUseCase } from '../../../shipping/application/use-cases/quote-shipping-rate.use-case';
import { InsufficientStockError } from '../../../inventory/domain/errors/inventory.errors';
import { Cart } from '../../domain/entities/cart.entity';
import type { CartItemProps } from '../../domain/entities/cart-item.entity';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { Slug } from '../../../catalog/domain/value-objects/slug.vo';
import { Money } from '../../../catalog/domain/value-objects/money.vo';
import { SeoMetadata } from '../../../catalog/domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../../catalog/domain/constants/product-status.constants';
import { StockReservation } from '../../../inventory/domain/entities/stock-reservation.entity';
import { STOCK_RESERVATION_STATUS } from '../../../inventory/domain/constants/stock-reservation-status.constants';
import { Order } from '../../../orders/domain/entities/order.entity';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { UnsupportedPaymentMethodError } from '../../../orders/domain/errors/order.errors';
import { EmptyCartError, ItemUnavailableAtCheckoutError } from '../../domain/errors/checkout.errors';

function buildCart(items: CartItemProps[]): Cart {
  return Cart.reconstitute({
    id: 'cart-1',
    storeId: 'store-1',
    guestToken: 'guest-token-abc',
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCartItem(variantId: string, quantity: number): CartItemProps {
  return { id: `item-${variantId}`, cartId: 'cart-1', variantId, quantity, createdAt: new Date(), updatedAt: new Date() };
}

function buildVariant(id: string, sku: string): ProductVariant {
  return ProductVariant.reconstitute({
    id,
    storeId: 'store-1',
    productId: `prod-${id}`,
    sku,
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildProduct(id: string, name: string, price: number): Product {
  return Product.reconstitute({
    id,
    storeId: 'store-1',
    name,
    slug: Slug.fromRaw(name.toLowerCase().replace(/\s+/g, '-')),
    sku: `SKU-${id}`,
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.ACTIVE,
    price: Money.create(price, 'IQD'),
    discountPrice: null,
    categoryId: 'cat-1',
    brandId: null,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    seo: SeoMetadata.create({}),
    highlights: [],
    richContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildReservation(id: string): StockReservation {
  return StockReservation.reconstitute({
    id,
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    cartId: 'cart-1',
    quantity: 2,
    status: STOCK_RESERVATION_STATUS.ACTIVE,
    expiresAt: new Date(Date.now() + 10 * 60_000),
    createdAt: new Date(),
    confirmedAt: null,
    releasedAt: null,
  });
}

function buildOrder(status: string): Order {
  return Order.reconstitute({
    id: 'order-1',
    storeId: 'store-1',
    orderNumber: 'ORD-20260802-ABCD1234',
    status: status as never,
    customerId: null,
    customerNameSnapshot: 'Demo Customer',
    customerEmailSnapshot: 'demo@example.com',
    customerPhoneSnapshot: '+9647700000000',
    shippingFullName: 'Demo Customer',
    shippingPhone: '+9647700000000',
    shippingLine1: '123 Al-Rasheed Street',
    shippingLine2: null,
    shippingCity: 'Baghdad',
    shippingGovernorate: 'Baghdad',
    shippingCountry: 'Iraq',
    subtotal: 78000,
    discountTotal: 0,
    shippingFee: 5000,
    taxTotal: 0,
    total: 83000,
    currencyCode: 'IQD',
    paymentMethod: PAYMENT_METHOD.COD,
    paymentStatus: status === ORDER_STATUS.CONFIRMED ? PAYMENT_STATUS.AWAITING_COLLECTION : PAYMENT_STATUS.PENDING,
    shippingMethodId: 'method-1',
    cancelReason: null,
    items: [],
    statusHistory: [],
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const VALID_INPUT: PlaceOrderInput = {
  guestToken: 'guest-token-abc',
  customerName: 'Demo Customer',
  customerEmail: 'demo@example.com',
  customerPhone: '+9647700000000',
  shippingFullName: 'Demo Customer',
  shippingPhone: '+9647700000000',
  shippingLine1: '123 Al-Rasheed Street',
  shippingCity: 'Baghdad',
  shippingGovernorate: 'Baghdad',
  shippingCountry: 'Iraq',
  shippingMethodId: 'method-1',
  paymentMethod: PAYMENT_METHOD.COD,
};

describe('PlaceOrderUseCase', () => {
  let carts: jest.Mocked<CartRepository>;
  let productVariants: jest.Mocked<ProductVariantRepository>;
  let products: jest.Mocked<ProductRepository>;
  let orders: jest.Mocked<OrderRepository>;
  let shipments: jest.Mocked<ShipmentRepository>;
  let createStockReservation: jest.Mocked<CreateStockReservationUseCase>;
  let confirmStockReservation: jest.Mocked<ConfirmStockReservationUseCase>;
  let releaseStockReservation: jest.Mocked<ReleaseStockReservationUseCase>;
  let quoteShippingRate: jest.Mocked<QuoteShippingRateUseCase>;
  let storeContext: { getCurrentStoreId: jest.Mock };
  let useCase: PlaceOrderUseCase;

  beforeEach(() => {
    carts = {
      findOrCreateByToken: jest.fn(),
      findByToken: jest.fn(),
      addItem: jest.fn(),
      setItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    productVariants = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      findByBarcode: jest.fn(),
      listByProduct: jest.fn(),
      countByProduct: jest.fn(),
      delete: jest.fn(),
    };
    products = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySku: jest.fn(),
      findManyByIds: jest.fn(),
      list: jest.fn(),
      replaceTags: jest.fn(),
      listTagIds: jest.fn(),
    };
    orders = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      list: jest.fn(),
      changeStatus: jest.fn(),
      addNote: jest.fn(),
      updatePaymentStatus: jest.fn(),
      listByCustomerId: jest.fn(),
      associateGuestOrders: jest.fn(),
    };
    shipments = {
      create: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      dispatch: jest.fn(),
      markDelivered: jest.fn(),
      appendTrackingEvent: jest.fn(),
      list: jest.fn(),
    };
    createStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<CreateStockReservationUseCase>;
    confirmStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<ConfirmStockReservationUseCase>;
    releaseStockReservation = { execute: jest.fn() } as unknown as jest.Mocked<ReleaseStockReservationUseCase>;
    quoteShippingRate = { execute: jest.fn() } as unknown as jest.Mocked<QuoteShippingRateUseCase>;
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') };

    useCase = new PlaceOrderUseCase(
      carts,
      productVariants,
      products,
      orders,
      shipments,
      createStockReservation,
      confirmStockReservation,
      releaseStockReservation,
      quoteShippingRate,
      storeContext as never,
    );
  });

  it('reserves stock, creates the order, auto-confirms COD, and clears the cart', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart([buildCartItem('variant-1', 2)]));
    productVariants.findById.mockResolvedValue(buildVariant('variant-1', 'ZA-TOP-VNECK-001-NVY-M'));
    products.findById.mockResolvedValue(buildProduct('prod-variant-1', 'Classic V-Neck Scrub Top', 39000));
    createStockReservation.execute.mockResolvedValue(buildReservation('res-1'));
    quoteShippingRate.execute.mockResolvedValue({ fee: 5000, zoneId: 'zone-1', estimatedDays: null });
    orders.create.mockResolvedValue(buildOrder(ORDER_STATUS.PENDING));
    orders.changeStatus.mockResolvedValue(buildOrder(ORDER_STATUS.CONFIRMED));

    const result = await useCase.execute(VALID_INPUT);

    expect(createStockReservation.execute).toHaveBeenCalledWith({
      variantId: 'variant-1',
      cartId: 'cart-1',
      quantity: 2,
    });
    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        paymentMethod: PAYMENT_METHOD.COD,
        subtotal: 78000,
        shippingMethodId: 'method-1',
        items: [
          expect.objectContaining({
            variantId: 'variant-1',
            stockReservationId: 'res-1',
            productNameSnapshot: 'Classic V-Neck Scrub Top',
            unitPrice: 39000,
            quantity: 2,
            lineTotal: 78000,
          }),
        ],
      }),
    );
    expect(confirmStockReservation.execute).toHaveBeenCalledWith({
      reservationId: 'res-1',
      actor: { actorId: null, actorType: ActorType.SYSTEM },
    });
    expect(orders.changeStatus).toHaveBeenCalledWith(
      'order-1',
      ORDER_STATUS.CONFIRMED,
      expect.any(String),
      { actorId: null, actorType: ActorType.SYSTEM },
      { paymentStatus: PAYMENT_STATUS.AWAITING_COLLECTION },
    );
    expect(shipments.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      orderId: 'order-1',
      shippingMethodId: 'method-1',
    });
    expect(carts.clear).toHaveBeenCalledWith('cart-1');
    expect(result.status).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('rejects CARD as a payment method before touching the cart', async () => {
    await expect(useCase.execute({ ...VALID_INPUT, paymentMethod: PAYMENT_METHOD.CARD })).rejects.toThrow(
      UnsupportedPaymentMethodError,
    );
    expect(carts.findOrCreateByToken).not.toHaveBeenCalled();
  });

  it('rejects an empty cart', async () => {
    carts.findOrCreateByToken.mockResolvedValue(buildCart([]));

    await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(EmptyCartError);
    expect(createStockReservation.execute).not.toHaveBeenCalled();
  });

  it('releases already-reserved items and surfaces which item is unavailable when one item cannot be reserved', async () => {
    carts.findOrCreateByToken.mockResolvedValue(
      buildCart([buildCartItem('variant-1', 2), buildCartItem('variant-2', 1)]),
    );
    productVariants.findById.mockImplementation((_storeId, variantId) => {
      if (variantId === 'variant-1') return Promise.resolve(buildVariant('variant-1', 'SKU-1'));
      if (variantId === 'variant-2') return Promise.resolve(buildVariant('variant-2', 'SKU-2'));
      return Promise.resolve(null);
    });
    products.findById.mockImplementation((_storeId, productId) => {
      if (productId === 'prod-variant-1') return Promise.resolve(buildProduct('prod-variant-1', 'Item One', 10000));
      if (productId === 'prod-variant-2') return Promise.resolve(buildProduct('prod-variant-2', 'Item Two', 20000));
      return Promise.resolve(null);
    });
    createStockReservation.execute
      .mockResolvedValueOnce(buildReservation('res-1'))
      .mockRejectedValueOnce(new InsufficientStockError(0, 1));

    await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(ItemUnavailableAtCheckoutError);

    expect(releaseStockReservation.execute).toHaveBeenCalledWith({ reservationId: 'res-1' });
    expect(orders.create).not.toHaveBeenCalled();
  });
});
