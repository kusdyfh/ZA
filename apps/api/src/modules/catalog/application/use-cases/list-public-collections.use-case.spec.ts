import { ListPublicCollectionsUseCase } from './list-public-collections.use-case';
import type { CollectionRepository } from '../../domain/repositories/collection.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Collection, type CollectionProps } from '../../domain/entities/collection.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

function buildCollection(overrides: Partial<CollectionProps> = {}): Collection {
  return Collection.reconstitute({
    id: overrides.id ?? 'col-1',
    storeId: 'store-1',
    name: 'Collection',
    slug: Slug.fromRaw(overrides.id ?? 'collection'),
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

describe('ListPublicCollectionsUseCase', () => {
  let collections: jest.Mocked<CollectionRepository>;
  let storeContext: StoreContext;
  let useCase: ListPublicCollectionsUseCase;

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
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new ListPublicCollectionsUseCase(collections, storeContext);
  });

  it('returns only currently-live collections', async () => {
    const live = buildCollection({ id: 'live', isActive: true });
    const inactive = buildCollection({ id: 'inactive', isActive: false });
    const notYetStarted = buildCollection({
      id: 'future',
      isActive: true,
      startsAt: new Date(Date.now() + 86_400_000),
    });
    collections.list.mockResolvedValue([live, inactive, notYetStarted]);

    const result = await useCase.execute();

    expect(result.map((c) => c.id)).toEqual(['live']);
  });

  it('returns an empty array when no collections are live', async () => {
    collections.list.mockResolvedValue([buildCollection({ isActive: false })]);
    expect(await useCase.execute()).toEqual([]);
  });
});
