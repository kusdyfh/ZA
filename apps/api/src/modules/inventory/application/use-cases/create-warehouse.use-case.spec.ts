import { CreateWarehouseUseCase } from './create-warehouse.use-case';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse, type WarehouseProps } from '../../domain/entities/warehouse.entity';
import { WarehouseCodeAlreadyInUseError } from '../../domain/errors/inventory.errors';

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

describe('CreateWarehouseUseCase', () => {
  let warehouses: jest.Mocked<WarehouseRepository>;
  let storeContext: StoreContext;
  let useCase: CreateWarehouseUseCase;

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
    useCase = new CreateWarehouseUseCase(warehouses, storeContext);
  });

  it('creates a warehouse when the code is free', async () => {
    warehouses.findByCode.mockResolvedValue(null);
    warehouses.create.mockResolvedValue(buildWarehouse());

    await useCase.execute({ name: 'Main Warehouse', code: 'main', isDefault: true });

    expect(warehouses.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      name: 'Main Warehouse',
      code: 'MAIN',
      isDefault: true,
    });
  });

  it('defaults isDefault to false when omitted', async () => {
    warehouses.findByCode.mockResolvedValue(null);
    warehouses.create.mockResolvedValue(buildWarehouse());

    await useCase.execute({ name: 'Secondary', code: 'SEC' });

    expect(warehouses.create).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: false }),
    );
  });

  it('throws WarehouseCodeAlreadyInUseError when the code is taken', async () => {
    warehouses.findByCode.mockResolvedValue(buildWarehouse());

    await expect(
      useCase.execute({ name: 'Main Warehouse', code: 'MAIN' }),
    ).rejects.toThrow(WarehouseCodeAlreadyInUseError);
    expect(warehouses.create).not.toHaveBeenCalled();
  });
});
