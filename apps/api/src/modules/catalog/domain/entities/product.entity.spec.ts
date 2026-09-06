import { Product, type ProductProps } from './product.entity';
import { Slug } from '../value-objects/slug.vo';
import { Money } from '../value-objects/money.vo';
import { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../constants/product-status.constants';
import { DiscountPriceNotLowerThanPriceError } from '../errors/catalog.errors';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  const props: ProductProps = {
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Classic V-Neck Scrub Top',
    slug: Slug.fromRaw('classic-v-neck-scrub-top'),
    sku: 'ZA-TOP-001',
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.DRAFT,
    price: Money.create(45000, 'IQD'),
    discountPrice: null,
    categoryId: 'cat-1',
    brandId: null,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    seo: SeoMetadata.create({}),
    highlights: [],
    richContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Product.reconstitute(props);
}

describe('Product#updatePricing', () => {
  it('re-validates before applying, via ProductPolicy', () => {
    const product = buildProduct();
    expect(() => product.updatePricing(Money.create(50, 'IQD'), Money.create(60, 'IQD'))).toThrow(
      DiscountPriceNotLowerThanPriceError,
    );
    expect(product.price.toNumber()).toBe(45000);
  });

  it('applies a valid price/discount pair', () => {
    const product = buildProduct();
    product.updatePricing(Money.create(50, 'IQD'), Money.create(40, 'IQD'));
    expect(product.price.toNumber()).toBe(50);
    expect(product.discountPrice?.toNumber()).toBe(40);
  });
});

describe('Product#isVisibleInCatalog', () => {
  it('is visible only when status is ACTIVE', () => {
    expect(buildProduct({ status: PRODUCT_STATUS.DRAFT }).isVisibleInCatalog()).toBe(false);
    expect(buildProduct({ status: PRODUCT_STATUS.ACTIVE }).isVisibleInCatalog()).toBe(true);
    expect(buildProduct({ status: PRODUCT_STATUS.ARCHIVED }).isVisibleInCatalog()).toBe(false);
  });
});

describe('Product#setMerchandisingFlags', () => {
  it('only updates flags explicitly provided', () => {
    const product = buildProduct({ isFeatured: true, isBestSeller: false });
    product.setMerchandisingFlags({ isBestSeller: true });
    expect(product.isFeatured).toBe(true);
    expect(product.isBestSeller).toBe(true);
  });
});

describe('Product#changeStatus', () => {
  it('performs the raw transition without gating (the gate lives in the use-case)', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    product.changeStatus(PRODUCT_STATUS.ACTIVE);
    expect(product.status).toBe(PRODUCT_STATUS.ACTIVE);
  });
});

describe('Product#updateHighlights', () => {
  it('trims entries and drops empty ones', () => {
    const product = buildProduct();
    product.updateHighlights(['  Moisture-wicking  ', '', '   ', '4-way stretch']);
    expect(product.highlights).toEqual(['Moisture-wicking', '4-way stretch']);
  });

  it('returns a defensive copy, not the internal array', () => {
    const product = buildProduct({ highlights: ['A'] });
    const highlights = product.highlights;
    highlights.push('B');
    expect(product.highlights).toEqual(['A']);
  });
});

describe('Product#updateRichContent', () => {
  it('normalizes blank content to null', () => {
    const product = buildProduct({ richContent: '<p>Story</p>' });
    product.updateRichContent('   ');
    expect(product.richContent).toBeNull();
  });

  it('keeps non-blank content', () => {
    const product = buildProduct();
    product.updateRichContent('<p>Our fabric story...</p>');
    expect(product.richContent).toBe('<p>Our fabric story...</p>');
  });
});
