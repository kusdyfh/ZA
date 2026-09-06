import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { WarehouseCodeAlreadyInUseError } from '../../domain/errors/inventory.errors';

export interface CreateWarehouseInput {
  name: string;
  code: string;
  isDefault?: boolean;
}

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateWarehouseInput): Promise<Warehouse> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Warehouse.validateName(input.name);
    const code = Warehouse.validateCode(input.code);

    const existing = await this.warehouses.findByCode(storeId, code);
    if (existing) {
      throw new WarehouseCodeAlreadyInUseError(code);
    }

    return this.warehouses.create({ storeId, name, code, isDefault: input.isDefault ?? false });
  }
}
