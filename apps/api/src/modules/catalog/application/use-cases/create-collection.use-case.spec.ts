import { CreateCollectionUseCase } from './create-collection.use-case';
import type { CollectionRepository } from '../../domain/repositories/collection.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection, type CollectionProps } from '../../domain/entities/collection.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { InvalidDateRangeError, SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

function buildCollection(overrides: Partial<CollectionProps> = {}): Collection {
  return Collection.reconstitute({
    id: 'col-1',
    storeId: 'store-1',
    name: 'Collection',
    slug: Slug.fromRaw('collection'),
    description: null,
    isActive: true,
    startsAt: null,
    endsAt: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('CreateCollectionUseCase', () => {
  let collections: jest.Mocked<CollectionRepository>;
  let storeContext: StoreContext;
  let useCase: CreateCollectionUseCase;

  beforeEach(() => {
    collections = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      replaceProducts: jest.fn(),
      listProducts: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
    } as unknown as StoreContext;
    useCase = new CreateCollectionUseCase(collections, storeContext);
  });

  it('creates a collection when valid', async () => {
    collections.findBySlug.mockResolvedValue(null);
    collections.create.mockResolvedValue(buildCollection());

    await useCase.execute({ name: 'New Arrivals' });

    expect(collections.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', name: 'New Arrivals' }),
    );
  });

  it('throws SlugAlreadyInUseError when the slug is taken', async () => {
    collections.findBySlug.mockResolvedValue(buildCollection());
    await expect(useCase.execute({ name: 'New Arrivals' })).rejects.toThrow(SlugAlreadyInUseError);
  });

  it('throws InvalidDateRangeError when endsAt is before startsAt', async () => {
    collections.findBySlug.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Sale',
        startsAt: new Date('2026-06-01'),
        endsAt: new Date('2026-05-01'),
      }),
    ).rejects.toThrow(InvalidDateRangeError);
    expect(collections.create).not.toHaveBeenCalled();
  });
});
