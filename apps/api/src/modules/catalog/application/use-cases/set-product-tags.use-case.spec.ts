import { SetProductTagsUseCase } from './set-product-tags.use-case';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { TagRepository } from '../../domain/repositories/tag.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product, type ProductProps } from '../../domain/entities/product.entity';
import { Tag, type TagProps } from '../../domain/entities/tag.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ProductNotFoundError, TagNotFoundError } from '../../domain/errors/catalog.errors';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Product',
    slug: Slug.fromRaw('product'),
    sku: 'SKU-1',
    shortDescription: null,
    description: null,
    status: PRODUCT_STATUS.ACTIVE,
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
  });
}

function buildTag(overrides: Partial<TagProps> = {}): Tag {
  return Tag.reconstitute({
    id: overrides.id ?? 'tag-1',
    storeId: 'store-1',
    name: 'Tag',
    slug: Slug.fromRaw(overrides.id ?? 'tag'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('SetProductTagsUseCase', () => {
  let products: jest.Mocked<ProductRepository>;
  let tags: jest.Mocked<TagRepository>;
  let storeContext: StoreContext;
  let useCase: SetProductTagsUseCase;

  beforeEach(() => {
    products = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySku: jest.fn(),
      findManyByIds: jest.fn(),
      list: jest.fn(),
      replaceTags: jest.fn(),
      listTagIds: jest.fn(),
    };
    tags = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findManyByIds: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new SetProductTagsUseCase(products, tags, storeContext);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute({ productId: 'missing', tagIds: [] })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('throws TagNotFoundError when a tag id does not exist', async () => {
    products.findById.mockResolvedValue(buildProduct());
    tags.findManyByIds.mockResolvedValue([]);

    await expect(useCase.execute({ productId: 'prod-1', tagIds: ['missing'] })).rejects.toThrow(
      TagNotFoundError,
    );
    expect(products.replaceTags).not.toHaveBeenCalled();
  });

  it('deduplicates and replaces the product tag set', async () => {
    products.findById.mockResolvedValue(buildProduct());
    tags.findManyByIds.mockResolvedValue([buildTag({ id: 'tag-1' }), buildTag({ id: 'tag-2' })]);

    await useCase.execute({ productId: 'prod-1', tagIds: ['tag-1', 'tag-2', 'tag-1'] });

    expect(products.replaceTags).toHaveBeenCalledWith('store-1', 'prod-1', ['tag-1', 'tag-2']);
  });
});
