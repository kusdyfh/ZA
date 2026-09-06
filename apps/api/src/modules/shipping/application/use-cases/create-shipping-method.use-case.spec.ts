import { CreateShippingMethodUseCase } from './create-shipping-method.use-case';
import type { ShippingMethodRepository } from '../../domain/repositories/shipping-method.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';

function buildMethod(): ShippingMethod {
  return ShippingMethod.reconstitute({
    id: 'method-1',
    storeId: 'store-1',
    name: 'Standard Delivery',
    minDays: 3,
    maxDays: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateShippingMethodUseCase', () => {
  let methods: jest.Mocked<ShippingMethodRepository>;
  let storeContext: StoreContext;
  let useCase: CreateShippingMethodUseCase;

  beforeEach(() => {
    methods = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    methods.create.mockResolvedValue(buildMethod());

    useCase = new CreateShippingMethodUseCase(methods, storeContext);
  });

  it('creates a method scoped to the current store', async () => {
    const result = await useCase.execute({ name: 'Standard Delivery', minDays: 3, maxDays: 5 });

    expect(methods.create).toHaveBeenCalledWith({
      storeId: 'store-1',
      name: 'Standard Delivery',
      minDays: 3,
      maxDays: 5,
    });
    expect(result).toBeInstanceOf(ShippingMethod);
  });
});
