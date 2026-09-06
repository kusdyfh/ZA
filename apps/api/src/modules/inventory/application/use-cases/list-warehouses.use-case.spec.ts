import { ListWarehousesUseCase } from './list-warehouses.use-case';
import type { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Warehouse } from '../../domain/entities/warehouse.entity';

describe('ListWarehousesUseCase', () => {
  let warehouses: jest.Mocked<WarehouseRepository>;
  let storeContext: StoreContext;
  let useCase: ListWarehousesUseCase;

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
    useCase = new ListWarehousesUseCase(warehouses, storeContext);
  });

  it('lists every warehouse for the current store', async () => {
    const warehouse = Warehouse.reconstitute({
      id: 'wh-1',
      storeId: 'store-1',
      name: 'Main Warehouse',
      code: 'MAIN',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    warehouses.list.mockResolvedValue([warehouse]);

    const result = await useCase.execute();

    expect(warehouses.list).toHaveBeenCalledWith('store-1');
    expect(result).toEqual([warehouse]);
  });
});
