import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { WAREHOUSE_REPOSITORY } from './domain/repositories/warehouse.repository';
import { VARIANT_STOCK_REPOSITORY } from './domain/repositories/variant-stock.repository';
import { STOCK_MOVEMENT_REPOSITORY } from './domain/repositories/stock-movement.repository';
import { STOCK_RESERVATION_REPOSITORY } from './domain/repositories/stock-reservation.repository';

import { PrismaWarehouseRepository } from './infrastructure/repositories/prisma-warehouse.repository';
import { PrismaVariantStockRepository } from './infrastructure/repositories/prisma-variant-stock.repository';
import { PrismaStockMovementRepository } from './infrastructure/repositories/prisma-stock-movement.repository';
import { PrismaStockReservationRepository } from './infrastructure/repositories/prisma-stock-reservation.repository';

import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { UpdateWarehouseUseCase } from './application/use-cases/update-warehouse.use-case';
import { ListWarehousesUseCase } from './application/use-cases/list-warehouses.use-case';

import { ReceiveStockUseCase } from './application/use-cases/receive-stock.use-case';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock.use-case';
import { GetVariantStockUseCase } from './application/use-cases/get-variant-stock.use-case';
import { ListLowStockVariantsUseCase } from './application/use-cases/list-low-stock-variants.use-case';
import { SetLowStockThresholdUseCase } from './application/use-cases/set-low-stock-threshold.use-case';

import { ProcessReturnUseCase } from './application/use-cases/process-return.use-case';
import { ListStockMovementsUseCase } from './application/use-cases/list-stock-movements.use-case';

import { CreateStockReservationUseCase } from './application/use-cases/create-stock-reservation.use-case';
import { ConfirmStockReservationUseCase } from './application/use-cases/confirm-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from './application/use-cases/release-stock-reservation.use-case';
import { ExpireStockReservationsUseCase } from './application/use-cases/expire-stock-reservations.use-case';
import { GetStockReservationUseCase } from './application/use-cases/get-stock-reservation.use-case';

import { WarehousesController } from './http/warehouses.controller';
import { StockController } from './http/stock.controller';
import { StockReservationsController } from './http/stock-reservations.controller';

/**
 * The Inventory bounded context (docs/06-DDD-BOUNDED-CONTEXTS.md) —
 * Warehouse/VariantStock/StockMovement/StockReservation, per Epic 4.
 * Epic 6 (API Layer) adds controllers directly here, guarded by the
 * app-wide `TemporaryAdminGuard`. Imports CatalogModule for the one
 * legitimate cross-module dependency this bounded context has:
 * verifying a ProductVariant exists before tracking stock against it
 * (docs/06-DDD-BOUNDED-CONTEXTS.md's Inventory section names this
 * dependency explicitly).
 */
const REPOSITORY_PROVIDERS = [
  { provide: WAREHOUSE_REPOSITORY, useClass: PrismaWarehouseRepository },
  { provide: VARIANT_STOCK_REPOSITORY, useClass: PrismaVariantStockRepository },
  { provide: STOCK_MOVEMENT_REPOSITORY, useClass: PrismaStockMovementRepository },
  { provide: STOCK_RESERVATION_REPOSITORY, useClass: PrismaStockReservationRepository },
];

const USE_CASE_PROVIDERS = [
  CreateWarehouseUseCase,
  UpdateWarehouseUseCase,
  ListWarehousesUseCase,

  ReceiveStockUseCase,
  AdjustStockUseCase,
  GetVariantStockUseCase,
  ListLowStockVariantsUseCase,
  SetLowStockThresholdUseCase,

  ProcessReturnUseCase,
  ListStockMovementsUseCase,

  CreateStockReservationUseCase,
  ConfirmStockReservationUseCase,
  ReleaseStockReservationUseCase,
  ExpireStockReservationsUseCase,
  GetStockReservationUseCase,
];

@Module({
  imports: [CatalogModule],
  controllers: [WarehousesController, StockController, StockReservationsController],
  providers: [...REPOSITORY_PROVIDERS, ...USE_CASE_PROVIDERS],
  exports: USE_CASE_PROVIDERS,
})
export class InventoryModule {}
