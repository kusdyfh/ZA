import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';

@Injectable()
export class ListWarehousesUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Warehouse[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.warehouses.list(storeId);
  }
}
