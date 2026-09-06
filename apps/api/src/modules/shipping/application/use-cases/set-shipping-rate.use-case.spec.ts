import { SetShippingRateUseCase } from './set-shipping-rate.use-case';
import type { ShippingRateRepository } from '../../domain/repositories/shipping-rate.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';

function buildRate(): ShippingRate {
  return ShippingRate.reconstitute({
    id: 'rate-1',
    storeId: 'store-1',
    zoneId: 'zone-1',
    methodId: 'method-1',
    fee: 5000,
    freeShippingThreshold: 50000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SetShippingRateUseCase', () => {
  let rates: jest.Mocked<ShippingRateRepository>;
  let storeContext: StoreContext;
  let useCase: SetShippingRateUseCase;

  beforeEach(() => {
    rates = {
      upsert: jest.fn(),
      findByZoneAndMethod: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    rates.upsert.mockResolvedValue(buildRate());

    useCase = new SetShippingRateUseCase(rates, storeContext);
  });

  it('upserts the rate for a (zone, method) pair scoped to the current store', async () => {
    const result = await useCase.execute({ zoneId: 'zone-1', methodId: 'method-1', fee: 5000, freeShippingThreshold: 50000 });

    expect(rates.upsert).toHaveBeenCalledWith({
      storeId: 'store-1',
      zoneId: 'zone-1',
      methodId: 'method-1',
      fee: 5000,
      freeShippingThreshold: 50000,
    });
    expect(result).toBeInstanceOf(ShippingRate);
  });

  it('defaults freeShippingThreshold to null when omitted', async () => {
    await useCase.execute({ zoneId: 'zone-1', methodId: 'method-1', fee: 5000 });

    expect(rates.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ freeShippingThreshold: null }),
    );
  });
});
