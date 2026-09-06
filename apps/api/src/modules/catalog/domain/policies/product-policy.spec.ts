import { ProductPolicy } from './product-policy';
import { Product, type ProductProps } from '../entities/product.entity';
import { Slug } from '../value-objects/slug.vo';
import { Money } from '../value-objects/money.vo';
import { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../constants/product-status.constants';
import { PRODUCT_MEDIA_TYPE } from '../constants/product-media-type.constants';
import {
  CoverImageMustBeImageError,
  DiscountPriceNotLowerThanPriceError,
  DuplicateVariantAttributesError,
  ImageAltTextRequiredError,
  InvalidNameError,
  LastCoverImageOfActiveProductError,
  LastVariantOfActiveProductError,
  MultipleCoverImagesError,
  ProductNotReadyForActiveError,
} from '../errors/catalog.errors';

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
    price: Money.create(100, 'IQD'),
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

describe('ProductPolicy.validateName / validateSku', () => {
  it('throws for a blank name', () => {
    expect(() => ProductPolicy.validateName('  ')).toThrow(InvalidNameError);
  });

  it('throws for a blank SKU', () => {
    expect(() => ProductPolicy.validateSku('  ')).toThrow(InvalidNameError);
  });
});

describe('ProductPolicy.validatePricing', () => {
  it('rejects a discount price not lower than the base price', () => {
    expect(() =>
      ProductPolicy.validatePricing(Money.create(100, 'IQD'), Money.create(100, 'IQD')),
    ).toThrow(DiscountPriceNotLowerThanPriceError);
  });

  it('accepts a lower discount price or none at all', () => {
    expect(() => ProductPolicy.validatePricing(Money.create(100, 'IQD'), null)).not.toThrow();
    expect(() =>
      ProductPolicy.validatePricing(Money.create(100, 'IQD'), Money.create(80, 'IQD')),
    ).not.toThrow();
  });
});

describe('ProductPolicy.assertReadyForActive', () => {
  it('allows a fully-formed product with a variant and cover image', () => {
    expect(() =>
      ProductPolicy.assertReadyForActive(buildProduct(), { hasVariant: true, hasCoverImage: true }),
    ).not.toThrow();
  });

  it('rejects when there is no variant', () => {
    expect(() =>
      ProductPolicy.assertReadyForActive(buildProduct(), { hasVariant: false, hasCoverImage: true }),
    ).toThrow(ProductNotReadyForActiveError);
  });

  it('rejects when there is no cover image', () => {
    expect(() =>
      ProductPolicy.assertReadyForActive(buildProduct(), { hasVariant: true, hasCoverImage: false }),
    ).toThrow(ProductNotReadyForActiveError);
  });

  it('lists every missing requirement in one error', () => {
    let caught: unknown;
    try {
      ProductPolicy.assertReadyForActive(buildProduct({ categoryId: '' }), {
        hasVariant: false,
        hasCoverImage: false,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ProductNotReadyForActiveError);
    expect((caught as Error).message).toContain('category');
    expect((caught as Error).message).toContain('variant');
    expect((caught as Error).message).toContain('cover image');
  });
});

describe('ProductPolicy.validateMediaSet', () => {
  it('allows an image with alt text and no cover', () => {
    expect(() =>
      ProductPolicy.validateMediaSet([
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: 'Front view', isCover: false },
      ]),
    ).not.toThrow();
  });

  it('rejects more than one cover', () => {
    expect(() =>
      ProductPolicy.validateMediaSet([
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: 'A', isCover: true },
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: 'B', isCover: true },
      ]),
    ).toThrow(MultipleCoverImagesError);
  });

  it('rejects a video marked as cover', () => {
    expect(() =>
      ProductPolicy.validateMediaSet([
        { type: PRODUCT_MEDIA_TYPE.VIDEO, altText: null, isCover: true },
      ]),
    ).toThrow(CoverImageMustBeImageError);
  });

  it('rejects an image with no alt text', () => {
    expect(() =>
      ProductPolicy.validateMediaSet([
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: '   ', isCover: false },
      ]),
    ).toThrow(ImageAltTextRequiredError);
  });

  it('does not require alt text on a video', () => {
    expect(() =>
      ProductPolicy.validateMediaSet([
        { type: PRODUCT_MEDIA_TYPE.VIDEO, altText: null, isCover: false },
      ]),
    ).not.toThrow();
  });
});

describe('ProductPolicy.assertNoDuplicateVariantAttributes', () => {
  const existing = [
    { id: 'v1', colorId: 'red', sizeId: 'm' },
    { id: 'v2', colorId: null, sizeId: null },
  ];

  it('rejects a new variant matching an existing color+size combination', () => {
    expect(() =>
      ProductPolicy.assertNoDuplicateVariantAttributes(existing, { colorId: 'red', sizeId: 'm' }),
    ).toThrow(DuplicateVariantAttributesError);
  });

  it('rejects a duplicate of a no-color/no-size variant', () => {
    expect(() =>
      ProductPolicy.assertNoDuplicateVariantAttributes(existing, { colorId: null, sizeId: null }),
    ).toThrow(DuplicateVariantAttributesError);
  });

  it('allows a genuinely new combination', () => {
    expect(() =>
      ProductPolicy.assertNoDuplicateVariantAttributes(existing, { colorId: 'blue', sizeId: 'l' }),
    ).not.toThrow();
  });

  it('excludes the variant being updated from the duplicate check', () => {
    expect(() =>
      ProductPolicy.assertNoDuplicateVariantAttributes(
        existing,
        { colorId: 'red', sizeId: 'm' },
        'v1',
      ),
    ).not.toThrow();
  });
});

describe('ProductPolicy.assertVariantRemovable', () => {
  it('blocks removing the last variant of an Active product', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ACTIVE });
    expect(() => ProductPolicy.assertVariantRemovable(product, 0)).toThrow(
      LastVariantOfActiveProductError,
    );
  });

  it('allows removing a variant when others remain', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ACTIVE });
    expect(() => ProductPolicy.assertVariantRemovable(product, 1)).not.toThrow();
  });

  it('allows removing the last variant of a Draft product', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    expect(() => ProductPolicy.assertVariantRemovable(product, 0)).not.toThrow();
  });
});

describe('ProductPolicy.assertActiveProductKeepsCoverImage', () => {
  it('blocks a media set with no cover for an Active product', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ACTIVE });
    expect(() =>
      ProductPolicy.assertActiveProductKeepsCoverImage(product, [
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: 'A', isCover: false },
      ]),
    ).toThrow(LastCoverImageOfActiveProductError);
  });

  it('allows a media set with a cover for an Active product', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.ACTIVE });
    expect(() =>
      ProductPolicy.assertActiveProductKeepsCoverImage(product, [
        { type: PRODUCT_MEDIA_TYPE.IMAGE, altText: 'A', isCover: true },
      ]),
    ).not.toThrow();
  });

  it('allows a media set with no cover for a Draft product', () => {
    const product = buildProduct({ status: PRODUCT_STATUS.DRAFT });
    expect(() => ProductPolicy.assertActiveProductKeepsCoverImage(product, [])).not.toThrow();
  });
});
