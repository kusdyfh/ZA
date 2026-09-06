import { ShippingZone, type ShippingZoneProps } from './shipping-zone.entity';

function buildZone(overrides: Partial<ShippingZoneProps> = {}): ShippingZone {
  const props: ShippingZoneProps = {
    id: 'zone-1',
    storeId: 'store-1',
    name: 'Central Iraq',
    governorates: ['Baghdad', 'Babil'],
    isActive: true,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    updatedAt: new Date('2026-08-05T12:00:00Z'),
    ...overrides,
  };
  return ShippingZone.reconstitute(props);
}

describe('ShippingZone', () => {
  it('exposes every field via getters', () => {
    const zone = buildZone();
    expect(zone.id).toBe('zone-1');
    expect(zone.storeId).toBe('store-1');
    expect(zone.name).toBe('Central Iraq');
    expect(zone.governorates).toEqual(['Baghdad', 'Babil']);
    expect(zone.isActive).toBe(true);
    expect(zone.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
    expect(zone.updatedAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('governorates getter returns a defensive copy', () => {
    const zone = buildZone();
    const governorates = zone.governorates;
    governorates.push('Karbala');
    expect(zone.governorates).toEqual(['Baghdad', 'Babil']);
  });

  describe('matches', () => {
    it('matches a governorate covered by an active zone', () => {
      const zone = buildZone({ governorates: ['Baghdad', 'Babil'], isActive: true });
      expect(zone.matches('Baghdad')).toBe(true);
    });

    it('does not match a governorate not covered by the zone', () => {
      const zone = buildZone({ governorates: ['Baghdad'], isActive: true });
      expect(zone.matches('Erbil')).toBe(false);
    });

    it('does not match any governorate when the zone is inactive', () => {
      const zone = buildZone({ governorates: ['Baghdad'], isActive: false });
      expect(zone.matches('Baghdad')).toBe(false);
    });
  });

  it('toProps returns an equivalent plain object with a defensive copy of governorates', () => {
    const props: ShippingZoneProps = {
      id: 'zone-2',
      storeId: 'store-1',
      name: 'South',
      governorates: ['Basra'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const zone = ShippingZone.reconstitute(props);
    const result = zone.toProps();
    expect(result).toEqual(props);
    expect(result.governorates).not.toBe(props.governorates);
  });

  it('is immutable — no mutator methods exist', () => {
    const zone = buildZone() as unknown as Record<string, unknown>;
    expect(zone.addGovernorate).toBeUndefined();
    expect(zone.deactivate).toBeUndefined();
  });
});
