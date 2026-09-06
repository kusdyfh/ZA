import { ProductVariant, type ProductVariantProps } from './product-variant.entity';
import { Money } from '../value-objects/money.vo';
import { InvalidNameError } from '../errors/catalog.errors';

function buildVariant(overrides: Partial<ProductVariantProps> = {}): ProductVariant {
  const props: ProductVariantProps = {
    id: 'variant-1',
    storeId: 'store-1',
    productId: 'prod-1',
    sku: 'ZA-TOP-001-NVY-M',
    barcode: null,
    colorId: null,
    sizeId: null,
    priceOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return ProductVariant.reconstitute(props);
}

describe('ProductVariant.validateSku', () => {
  it('trims and returns a non-empty SKU', () => {
    expect(ProductVariant.validateSku('  ZA-TOP-001  ')).toBe('ZA-TOP-001');
  });

  it('throws for a blank SKU', () => {
    expect(() => ProductVariant.validateSku('   ')).toThrow(InvalidNameError);
  });
});

describe('ProductVariant mutations', () => {
  it('changeSku validates and updates the SKU', () => {
    const variant = buildVariant();
    variant.changeSku('ZA-TOP-002');
    expect(variant.sku).toBe('ZA-TOP-002');
  });

  it('changeBarcode normalizes blank input to null', () => {
    const variant = buildVariant({ barcode: '12345' });
    variant.changeBarcode('   ');
    expect(variant.barcode).toBeNull();
  });

  it('changeBarcode trims and keeps non-blank input', () => {
    const variant = buildVariant();
    variant.changeBarcode('  9781234567897  ');
    expect(variant.barcode).toBe('9781234567897');
  });

  it('changeAttributes updates color and size independently', () => {
    const variant = buildVariant();
    variant.changeAttributes('color-1', 'size-1');
    expect(variant.colorId).toBe('color-1');
    expect(variant.sizeId).toBe('size-1');
  });

  it('changePriceOverride accepts a Money value or null', () => {
    const variant = buildVariant();
    variant.changePriceOverride(Money.create(50, 'IQD'));
    expect(variant.priceOverride?.toNumber()).toBe(50);
    variant.changePriceOverride(null);
    expect(variant.priceOverride).toBeNull();
  });
});
