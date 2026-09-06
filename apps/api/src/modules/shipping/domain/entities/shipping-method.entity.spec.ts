import { ShippingMethod, type ShippingMethodProps } from './shipping-method.entity';

function buildMethod(overrides: Partial<ShippingMethodProps> = {}): ShippingMethod {
  const props: ShippingMethodProps = {
    id: 'method-1',
    storeId: 'store-1',
    name: 'Standard Delivery',
    minDays: 3,
    maxDays: 5,
    isActive: true,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    updatedAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return ShippingMethod.reconstitute(props);
}

describe('ShippingMethod', () => {
  it('exposes every field via getters', () => {
    const method = buildMethod();
    expect(method.id).toBe('method-1');
    expect(method.storeId).toBe('store-1');
    expect(method.name).toBe('Standard Delivery');
    expect(method.minDays).toBe(3);
    expect(method.maxDays).toBe(5);
    expect(method.isActive).toBe(true);
    expect(method.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
    expect(method.updatedAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('reflects an inactive method', () => {
    const method = buildMethod({ isActive: false });
    expect(method.isActive).toBe(false);
  });

  it('toProps returns an equivalent plain object', () => {
    const props: ShippingMethodProps = {
      id: 'method-2',
      storeId: 'store-1',
      name: 'Express',
      minDays: 1,
      maxDays: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const method = ShippingMethod.reconstitute(props);
    expect(method.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist', () => {
    const method = buildMethod() as unknown as Record<string, unknown>;
    expect(method.deactivate).toBeUndefined();
    expect(method.rename).toBeUndefined();
  });
});
