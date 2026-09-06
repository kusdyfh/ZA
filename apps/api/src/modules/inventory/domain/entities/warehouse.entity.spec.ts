import { Warehouse, type WarehouseProps } from './warehouse.entity';
import { InvalidNameError } from '../errors/inventory.errors';

function buildWarehouse(overrides: Partial<WarehouseProps> = {}): Warehouse {
  const props: WarehouseProps = {
    id: 'wh-1',
    storeId: 'store-1',
    name: 'Main Warehouse',
    code: 'MAIN',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Warehouse.reconstitute(props);
}

describe('Warehouse.validateName', () => {
  it('trims a valid name', () => {
    expect(Warehouse.validateName('  Main Warehouse  ')).toBe('Main Warehouse');
  });

  it('throws for a blank name', () => {
    expect(() => Warehouse.validateName('   ')).toThrow(InvalidNameError);
  });
});

describe('Warehouse.validateCode', () => {
  it('trims and upper-cases a valid code', () => {
    expect(Warehouse.validateCode('  main  ')).toBe('MAIN');
  });

  it('throws for a blank code', () => {
    expect(() => Warehouse.validateCode('   ')).toThrow(InvalidNameError);
  });
});

describe('Warehouse#rename / #changeCode', () => {
  it('renames the warehouse', () => {
    const warehouse = buildWarehouse();
    warehouse.rename('Secondary Warehouse');
    expect(warehouse.name).toBe('Secondary Warehouse');
  });

  it('changes the code, normalizing it', () => {
    const warehouse = buildWarehouse();
    warehouse.changeCode('secondary');
    expect(warehouse.code).toBe('SECONDARY');
  });

  it('rejects a blank rename', () => {
    const warehouse = buildWarehouse();
    expect(() => warehouse.rename('  ')).toThrow(InvalidNameError);
  });
});
