import { ShippingRate, type ShippingRateProps } from './shipping-rate.entity';

function buildRate(overrides: Partial<ShippingRateProps> = {}): ShippingRate {
  const props: ShippingRateProps = {
    id: 'rate-1',
    storeId: 'store-1',
    zoneId: 'zone-1',
    methodId: 'method-1',
    fee: 5000,
    freeShippingThreshold: 50000,
    isActive: true,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    updatedAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return ShippingRate.reconstitute(props);
}

describe('ShippingRate', () => {
  it('exposes every field via getters', () => {
    const rate = buildRate();
    expect(rate.id).toBe('rate-1');
    expect(rate.storeId).toBe('store-1');
    expect(rate.zoneId).toBe('zone-1');
    expect(rate.methodId).toBe('method-1');
    expect(rate.fee).toBe(5000);
    expect(rate.freeShippingThreshold).toBe(50000);
    expect(rate.isActive).toBe(true);
    expect(rate.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
    expect(rate.updatedAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  describe('computeFee', () => {
    it('charges the flat fee when the net subtotal is below the free-shipping threshold', () => {
      const rate = buildRate({ fee: 5000, freeShippingThreshold: 50000 });
      expect(rate.computeFee(49999)).toBe(5000);
    });

    it('waives the fee once the net subtotal meets the free-shipping threshold', () => {
      const rate = buildRate({ fee: 5000, freeShippingThreshold: 50000 });
      expect(rate.computeFee(50000)).toBe(0);
    });

    it('waives the fee when the net subtotal exceeds the free-shipping threshold', () => {
      const rate = buildRate({ fee: 5000, freeShippingThreshold: 50000 });
      expect(rate.computeFee(100000)).toBe(0);
    });

    it('always charges the flat fee when there is no free-shipping threshold', () => {
      const rate = buildRate({ fee: 5000, freeShippingThreshold: null });
      expect(rate.computeFee(0)).toBe(5000);
      expect(rate.computeFee(1_000_000)).toBe(5000);
    });
  });

  it('toProps returns an equivalent plain object', () => {
    const props: ShippingRateProps = {
      id: 'rate-2',
      storeId: 'store-1',
      zoneId: 'zone-2',
      methodId: 'method-2',
      fee: 10000,
      freeShippingThreshold: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rate = ShippingRate.reconstitute(props);
    expect(rate.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist', () => {
    const rate = buildRate() as unknown as Record<string, unknown>;
    expect(rate.setFee).toBeUndefined();
    expect(rate.deactivate).toBeUndefined();
  });
});
