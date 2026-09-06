import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { WarehouseCodeAlreadyInUseError, WarehouseNotFoundError } from '../../domain/errors/inventory.errors';

export interface UpdateWarehouseInput {
  warehouseId: string;
  name: string;
  code: string;
}

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateWarehouseInput): Promise<Warehouse> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const warehouse = await this.warehouses.findById(storeId, input.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError(input.warehouseId);
    }

    const code = Warehouse.validateCode(input.code);
    if (code !== warehouse.code) {
      const existing = await this.warehouses.findByCode(storeId, code);
      if (existing) {
        throw new WarehouseCodeAlreadyInUseError(code);
      }
    }

    warehouse.rename(Warehouse.validateName(input.name));
    warehouse.changeCode(code);

    await this.warehouses.save(warehouse);
    return warehouse;
  }
}
