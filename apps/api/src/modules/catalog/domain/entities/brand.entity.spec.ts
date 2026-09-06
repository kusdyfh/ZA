import { Brand, type BrandProps } from './brand.entity';
import { Slug } from '../value-objects/slug.vo';
import { InvalidNameError } from '../errors/catalog.errors';

function buildBrand(overrides: Partial<BrandProps> = {}): Brand {
  const props: BrandProps = {
    id: 'brand-1',
    storeId: 'store-1',
    name: 'ZA Originals',
    slug: Slug.fromRaw('za-originals'),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Brand.reconstitute(props);
}

describe('Brand', () => {
  it('validateName trims and rejects blank names', () => {
    expect(Brand.validateName('  ZA  ')).toBe('ZA');
    expect(() => Brand.validateName(' ')).toThrow(InvalidNameError);
  });

  it('rename validates and updates the name', () => {
    const brand = buildBrand();
    brand.rename('ComfortFit');
    expect(brand.name).toBe('ComfortFit');
  });

  it('updateDescription accepts null', () => {
    const brand = buildBrand({ description: 'Something' });
    brand.updateDescription(null);
    expect(brand.description).toBeNull();
  });
});
