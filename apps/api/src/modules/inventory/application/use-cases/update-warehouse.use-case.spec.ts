import { UpdateWarehouseUseCase } from './update-warehouse.use-case';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse, type WarehouseProps } from '../../domain/entities/warehouse.entity';
import {
  WarehouseCodeAlreadyInUseError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';

function buildWarehouse(overrides: Partial<WarehouseProps> = {}): Warehouse {
  return Warehouse.reconstitute({
    id: 'wh-1',
    storeId: 'store-1',
    name: 'Main Warehouse',
    code: 'MAIN',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('UpdateWarehouseUseCase', () => {
  let warehouses: jest.Mocked<WarehouseRepository>;
  let storeContext: StoreContext;
  let useCase: UpdateWarehouseUseCase;

  beforeEach(() => {
    warehouses = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findDefault: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new UpdateWarehouseUseCase(warehouses, storeContext);
  });

  it('renames and re-codes the warehouse', async () => {
    warehouses.findById.mockResolvedValue(buildWarehouse());

    const result = await useCase.execute({ warehouseId: 'wh-1', name: 'Renamed', code: 'MAIN' });

    expect(result.name).toBe('Renamed');
    expect(warehouses.save).toHaveBeenCalled();
  });

  it('throws WarehouseNotFoundError for an unknown warehouse', async () => {
    warehouses.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ warehouseId: 'missing', name: 'X', code: 'X' }),
    ).rejects.toThrow(WarehouseNotFoundError);
  });

  it('allows keeping the same code without a uniqueness check', async () => {
    warehouses.findById.mockResolvedValue(buildWarehouse({ code: 'MAIN' }));

    await useCase.execute({ warehouseId: 'wh-1', name: 'Main Warehouse', code: 'MAIN' });

    expect(warehouses.findByCode).not.toHaveBeenCalled();
  });

  it('throws WarehouseCodeAlreadyInUseError when changing to a code already in use elsewhere', async () => {
    warehouses.findById.mockResolvedValue(buildWarehouse({ code: 'MAIN' }));
    warehouses.findByCode.mockResolvedValue(buildWarehouse({ id: 'wh-2', code: 'SEC' }));

    await expect(
      useCase.execute({ warehouseId: 'wh-1', name: 'Main Warehouse', code: 'SEC' }),
    ).rejects.toThrow(WarehouseCodeAlreadyInUseError);
    expect(warehouses.save).not.toHaveBeenCalled();
  });
});
