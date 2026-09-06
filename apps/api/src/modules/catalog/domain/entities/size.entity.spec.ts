import { Size, type SizeProps } from './size.entity';
import { InvalidNameError } from '../errors/catalog.errors';

function buildSize(overrides: Partial<SizeProps> = {}): Size {
  const props: SizeProps = {
    id: 'size-1',
    storeId: 'store-1',
    label: 'M',
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Size.reconstitute(props);
}

describe('Size.validateLabel', () => {
  it('trims and returns a non-empty label', () => {
    expect(Size.validateLabel('  M  ')).toBe('M');
  });

  it('throws for a blank label', () => {
    expect(() => Size.validateLabel('   ')).toThrow(InvalidNameError);
  });
});

describe('Size mutations', () => {
  it('relabel validates and updates the label', () => {
    const size = buildSize();
    size.relabel('L');
    expect(size.label).toBe('L');
  });

  it('reorder updates sortOrder', () => {
    const size = buildSize({ sortOrder: 2 });
    size.reorder(5);
    expect(size.sortOrder).toBe(5);
  });
});
