import { SetProductMediaUseCase } from './set-product-media.use-case';
import type { ProductMediaRepository } from '../../domain/repositories/product-media.repository';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { ColorRepository } from '../../domain/repositories/color.repository';
import type { Color } from '../../domain/entities/color.entity';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  Product,
  type ProductProps,
} from '../../domain/entities/product.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { PRODUCT_MEDIA_TYPE } from '../../domain/constants/product-media-type.constants';
import {
  ColorNotFoundError,
  ImageAltTextRequiredError,
  LastCoverImageOfActiveProductError,
  MultipleCoverImagesError,
  ProductNotFoundError,
} from '../../domain/errors/catalog.errors';

function buildProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({
    id: 'prod-1',
    storeId: 'store-1',
    name: 'Product',
    slug: Slug.fromRaw('product'),
    sku: 'SKU-1',
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
  });
}

describe('SetProductMediaUseCase', () => {
  let media: jest.Mocked<ProductMediaRepository>;
  let products: jest.Mocked<ProductRepository>;
  let colors: jest.Mocked<ColorRepository>;
  let storeContext: StoreContext;
  let useCase: SetProductMediaUseCase;

  beforeEach(() => {
    media = { replaceForProduct: jest.fn(), listByProduct: jest.fn() };
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
    colors = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new SetProductMediaUseCase(media, products, colors, storeContext);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'missing', media: [] }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('replaces the media set when valid', async () => {
    products.findById.mockResolvedValue(
      buildProduct({ status: PRODUCT_STATUS.DRAFT }),
    );
    const entries = [
      {
        type: PRODUCT_MEDIA_TYPE.IMAGE,
        url: 'https://example.com/a.jpg',
        altText: 'A',
        isCover: true,
        colorId: null,
      },
    ];

    await useCase.execute({ productId: 'prod-1', media: entries });

    expect(media.replaceForProduct).toHaveBeenCalledWith('prod-1', entries);
  });

  it('rejects an image with no alt text before writing anything', async () => {
    products.findById.mockResolvedValue(buildProduct());
    await expect(
      useCase.execute({
        productId: 'prod-1',
        media: [
          {
            type: PRODUCT_MEDIA_TYPE.IMAGE,
            url: 'https://example.com/a.jpg',
            altText: null,
            isCover: false,
            colorId: null,
          },
        ],
      }),
    ).rejects.toThrow(ImageAltTextRequiredError);
    expect(media.replaceForProduct).not.toHaveBeenCalled();
  });

  it('rejects more than one cover image', async () => {
    products.findById.mockResolvedValue(buildProduct());
    await expect(
      useCase.execute({
        productId: 'prod-1',
        media: [
          {
            type: PRODUCT_MEDIA_TYPE.IMAGE,
            url: 'https://example.com/a.jpg',
            altText: 'A',
            isCover: true,
            colorId: null,
          },
          {
            type: PRODUCT_MEDIA_TYPE.IMAGE,
            url: 'https://example.com/b.jpg',
            altText: 'B',
            isCover: true,
            colorId: null,
          },
        ],
      }),
    ).rejects.toThrow(MultipleCoverImagesError);
  });

  it('rejects removing the cover image from a currently-Active product', async () => {
    products.findById.mockResolvedValue(
      buildProduct({ status: PRODUCT_STATUS.ACTIVE }),
    );
    await expect(
      useCase.execute({
        productId: 'prod-1',
        media: [
          {
            type: PRODUCT_MEDIA_TYPE.IMAGE,
            url: 'https://example.com/a.jpg',
            altText: 'A',
            isCover: false,
            colorId: null,
          },
        ],
      }),
    ).rejects.toThrow(LastCoverImageOfActiveProductError);
  });

  it('accepts media tagged with an existing color', async () => {
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue({ id: 'color-1' } as Color);
    const entries = [
      {
        type: PRODUCT_MEDIA_TYPE.IMAGE,
        url: 'https://example.com/a.jpg',
        altText: 'A',
        isCover: true,
        colorId: 'color-1',
      },
      {
        type: PRODUCT_MEDIA_TYPE.IMAGE,
        url: 'https://example.com/b.jpg',
        altText: 'B',
        isCover: false,
        colorId: 'color-1',
      },
    ];

    await useCase.execute({ productId: 'prod-1', media: entries });

    expect(colors.findById).toHaveBeenCalledTimes(1);
    expect(colors.findById).toHaveBeenCalledWith('store-1', 'color-1');
    expect(media.replaceForProduct).toHaveBeenCalledWith('prod-1', entries);
  });

  it('rejects media tagged with an unknown color before writing anything', async () => {
    products.findById.mockResolvedValue(buildProduct());
    colors.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({
        productId: 'prod-1',
        media: [
          {
            type: PRODUCT_MEDIA_TYPE.IMAGE,
            url: 'https://example.com/a.jpg',
            altText: 'A',
            isCover: true,
            colorId: 'ghost',
          },
        ],
      }),
    ).rejects.toThrow(ColorNotFoundError);
    expect(media.replaceForProduct).not.toHaveBeenCalled();
  });
});
