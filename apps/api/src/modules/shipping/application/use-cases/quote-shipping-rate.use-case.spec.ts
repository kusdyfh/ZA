import { QuoteShippingRateUseCase } from './quote-shipping-rate.use-case';
import type { ShippingZoneRepository } from '../../domain/repositories/shipping-zone.repository';
import type { ShippingRateRepository } from '../../domain/repositories/shipping-rate.repository';
import type { ShippingMethodRepository } from '../../domain/repositories/shipping-method.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';
import { ShippingMethod } from '../../domain/entities/shipping-method.entity';
import { UnsupportedDeliveryRegionError, ShippingRateNotFoundError } from '../../domain/errors/shipping.errors';

function buildZone(): ShippingZone {
  return ShippingZone.reconstitute({
    id: 'zone-1',
    storeId: 'store-1',
    name: 'Central Iraq',
    governorates: ['Baghdad'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildRate(overrides: Partial<{ fee: number; freeShippingThreshold: number | null; isActive: boolean }> = {}): ShippingRate {
  return ShippingRate.reconstitute({
    id: 'rate-1',
    storeId: 'store-1',
    zoneId: 'zone-1',
    methodId: 'method-1',
    fee: overrides.fee ?? 5000,
    freeShippingThreshold: overrides.freeShippingThreshold === undefined ? 50000 : overrides.freeShippingThreshold,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

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

describe('QuoteShippingRateUseCase', () => {
  let zones: jest.Mocked<ShippingZoneRepository>;
  let rates: jest.Mocked<ShippingRateRepository>;
  let methods: jest.Mocked<ShippingMethodRepository>;
  let storeContext: StoreContext;
  let useCase: QuoteShippingRateUseCase;

  beforeEach(() => {
    zones = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByGovernorate: jest.fn(),
      list: jest.fn(),
    };
    rates = {
      upsert: jest.fn(),
      findByZoneAndMethod: jest.fn(),
      list: jest.fn(),
    };
    methods = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;

    useCase = new QuoteShippingRateUseCase(zones, rates, methods, storeContext);
  });

  it('throws UnsupportedDeliveryRegionError when no zone covers the governorate', async () => {
    zones.findByGovernorate.mockResolvedValue(null);

    await expect(
      useCase.execute({ governorate: 'Erbil', methodId: 'method-1', subtotal: 10000, discountTotal: 0 }),
    ).rejects.toThrow(UnsupportedDeliveryRegionError);
    expect(rates.findByZoneAndMethod).not.toHaveBeenCalled();
  });

  it('throws ShippingRateNotFoundError when no rate exists for the zone+method pair', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(null);

    await expect(
      useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 10000, discountTotal: 0 }),
    ).rejects.toThrow(ShippingRateNotFoundError);
  });

  it('throws ShippingRateNotFoundError when the matching rate is inactive', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(buildRate({ isActive: false }));

    await expect(
      useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 10000, discountTotal: 0 }),
    ).rejects.toThrow(ShippingRateNotFoundError);
  });

  it('charges the flat fee when the net subtotal is below the free-shipping threshold', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(buildRate({ fee: 5000, freeShippingThreshold: 50000 }));
    methods.findById.mockResolvedValue(buildMethod());

    const result = await useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 40000, discountTotal: 0 });

    expect(result.fee).toBe(5000);
    expect(result.zoneId).toBe('zone-1');
    expect(result.estimatedDays).toEqual({ min: 3, max: 5 });
  });

  it('waives the fee once (subtotal - discountTotal) meets the free-shipping threshold', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(buildRate({ fee: 5000, freeShippingThreshold: 50000 }));
    methods.findById.mockResolvedValue(buildMethod());

    const result = await useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 70000, discountTotal: 15000 });

    expect(result.fee).toBe(0);
  });

  it('evaluates the free-shipping threshold against the discounted net subtotal, not the raw subtotal', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(buildRate({ fee: 5000, freeShippingThreshold: 50000 }));
    methods.findById.mockResolvedValue(buildMethod());

    // subtotal alone clears the threshold, but net (subtotal - discount) does not.
    const result = await useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 55000, discountTotal: 10000 });

    expect(result.fee).toBe(5000);
  });

  it('returns null estimatedDays when the shipping method cannot be found', async () => {
    zones.findByGovernorate.mockResolvedValue(buildZone());
    rates.findByZoneAndMethod.mockResolvedValue(buildRate());
    methods.findById.mockResolvedValue(null);

    const result = await useCase.execute({ governorate: 'Baghdad', methodId: 'method-1', subtotal: 10000, discountTotal: 0 });

    expect(result.estimatedDays).toBeNull();
  });
});
