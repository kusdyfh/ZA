import { Module } from '@nestjs/common';
import { SHIPPING_ZONE_REPOSITORY } from './domain/repositories/shipping-zone.repository';
import { PrismaShippingZoneRepository } from './infrastructure/repositories/prisma-shipping-zone.repository';
import { SHIPPING_METHOD_REPOSITORY } from './domain/repositories/shipping-method.repository';
import { PrismaShippingMethodRepository } from './infrastructure/repositories/prisma-shipping-method.repository';
import { SHIPPING_RATE_REPOSITORY } from './domain/repositories/shipping-rate.repository';
import { PrismaShippingRateRepository } from './infrastructure/repositories/prisma-shipping-rate.repository';
import { SHIPMENT_REPOSITORY } from './domain/repositories/shipment.repository';
import { PrismaShipmentRepository } from './infrastructure/repositories/prisma-shipment.repository';
import { SHIPPING_PROVIDER } from './domain/ports/shipping-provider.port';
import { ManualShippingProvider } from './infrastructure/providers/manual-shipping.provider';
import { QuoteShippingRateUseCase } from './application/use-cases/quote-shipping-rate.use-case';
import { CreateShippingZoneUseCase } from './application/use-cases/create-shipping-zone.use-case';
import { UpdateShippingZoneUseCase } from './application/use-cases/update-shipping-zone.use-case';
import { ListShippingZonesUseCase } from './application/use-cases/list-shipping-zones.use-case';
import { CreateShippingMethodUseCase } from './application/use-cases/create-shipping-method.use-case';
import { UpdateShippingMethodUseCase } from './application/use-cases/update-shipping-method.use-case';
import { ListShippingMethodsUseCase } from './application/use-cases/list-shipping-methods.use-case';
import { SetShippingRateUseCase } from './application/use-cases/set-shipping-rate.use-case';
import { ListShippingRatesUseCase } from './application/use-cases/list-shipping-rates.use-case';
import { DispatchShipmentUseCase } from './application/use-cases/dispatch-shipment.use-case';
import { MarkShipmentDeliveredUseCase } from './application/use-cases/mark-shipment-delivered.use-case';
import { GetShipmentUseCase } from './application/use-cases/get-shipment.use-case';
import { GetShipmentByOrderUseCase } from './application/use-cases/get-shipment-by-order.use-case';
import { ListShipmentsUseCase } from './application/use-cases/list-shipments.use-case';
import { TrackShipmentUseCase } from './application/use-cases/track-shipment.use-case';
import { ShippingZonesController } from './http/shipping-zones.controller';
import { ShippingMethodsController } from './http/shipping-methods.controller';
import { ShippingRatesController } from './http/shipping-rates.controller';
import { ShipmentsController } from './http/shipments.controller';
import { StorefrontShippingController } from './http/storefront-shipping.controller';
import { OrdersModule } from '../orders/orders.module';

/**
 * HTTP-facing Shipping (ADR 0027) — admin CRUD for zones/methods/rates,
 * shipment dispatch/delivery, and the customer-facing tracking read.
 * Depends on `OrdersModule` (already exported) for `AdvanceOrderStatusUseCase`
 * — the same "Order status synchronization" call every dispatch/delivery
 * makes.
 */
@Module({
  imports: [OrdersModule],
  controllers: [
    ShippingZonesController,
    ShippingMethodsController,
    ShippingRatesController,
    ShipmentsController,
    StorefrontShippingController,
  ],
  providers: [
    { provide: SHIPPING_ZONE_REPOSITORY, useClass: PrismaShippingZoneRepository },
    { provide: SHIPPING_METHOD_REPOSITORY, useClass: PrismaShippingMethodRepository },
    { provide: SHIPPING_RATE_REPOSITORY, useClass: PrismaShippingRateRepository },
    { provide: SHIPMENT_REPOSITORY, useClass: PrismaShipmentRepository },
    { provide: SHIPPING_PROVIDER, useClass: ManualShippingProvider },
    QuoteShippingRateUseCase,
    CreateShippingZoneUseCase,
    UpdateShippingZoneUseCase,
    ListShippingZonesUseCase,
    CreateShippingMethodUseCase,
    UpdateShippingMethodUseCase,
    ListShippingMethodsUseCase,
    SetShippingRateUseCase,
    ListShippingRatesUseCase,
    DispatchShipmentUseCase,
    MarkShipmentDeliveredUseCase,
    GetShipmentUseCase,
    GetShipmentByOrderUseCase,
    ListShipmentsUseCase,
    TrackShipmentUseCase,
  ],
  exports: [
    SHIPMENT_REPOSITORY,
    SHIPPING_ZONE_REPOSITORY,
    SHIPPING_METHOD_REPOSITORY,
    SHIPPING_RATE_REPOSITORY,
    QuoteShippingRateUseCase,
    GetShipmentByOrderUseCase,
  ],
})
export class ShippingModule {}
