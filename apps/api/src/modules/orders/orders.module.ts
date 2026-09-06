import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';

import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { AdvanceOrderStatusUseCase } from './application/use-cases/advance-order-status.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { AddOrderNoteUseCase } from './application/use-cases/add-order-note.use-case';
import { OrdersController } from './http/orders.controller';

/**
 * The Order aggregate (docs/06-DDD-BOUNDED-CONTEXTS.md's "Orders" —
 * lifecycle, timeline, notes). Imports InventoryModule for
 * `CancelOrderUseCase`'s release-or-restock logic (docs/v2/adr/0015 §4).
 * Epic 6 (API Layer) adds a guarded controller directly here.
 */
const REPOSITORY_PROVIDERS = [{ provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository }];

const USE_CASE_PROVIDERS = [
  GetOrderUseCase,
  ListOrdersUseCase,
  AdvanceOrderStatusUseCase,
  CancelOrderUseCase,
  AddOrderNoteUseCase,
];

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [...REPOSITORY_PROVIDERS, ...USE_CASE_PROVIDERS],
  // ORDER_REPOSITORY is exported (in addition to use-cases) so the
  // Checkout module can create an Order and confirm its payment status
  // directly — docs/06-DDD-BOUNDED-CONTEXTS.md's Checkout section
  // describes the saga as "...initiate payment → create Order (Orders)
  // → clear cart," which is Checkout writing into this aggregate, not a
  // pass-through Orders use-case. Matches the same precedent as
  // CatalogModule exporting PRODUCT_VARIANT_REPOSITORY/PRODUCT_REPOSITORY.
  exports: [...USE_CASE_PROVIDERS, ORDER_REPOSITORY],
})
export class OrdersModule {}
