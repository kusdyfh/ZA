import { CreateCategoryUseCase } from './create-category.use-case';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category, type CategoryProps } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { CategoryDepthExceededError, SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  return Category.reconstitute({
    id: overrides.id ?? 'cat-1',
    storeId: 'store-1',
    name: 'Category',
    slug: Slug.fromRaw(overrides.id ?? 'category'),
    description: null,
    sortOrder: 0,
    isActive: true,
    parentId: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function mockFindById(categories: jest.Mocked<CategoryRepository>, byId: Record<string, Category>) {
  categories.findById.mockImplementation((_storeId, id) => Promise.resolve(byId[id] ?? null));
}

describe('CreateCategoryUseCase', () => {
  let categories: jest.Mocked<CategoryRepository>;
  let storeContext: StoreContext;
  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    categories = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
      countChildren: jest.fn(),
      countProducts: jest.fn(),
    };
    storeContext = {
      getCurrentStoreId: jest.fn().mockResolvedValue('store-1'),
      getDefaultCurrency: jest.fn().mockResolvedValue('IQD'),
    } as unknown as StoreContext;
    useCase = new CreateCategoryUseCase(categories, storeContext);
  });

  it('creates a root category when no parent is given', async () => {
    categories.findBySlug.mockResolvedValue(null);
    categories.create.mockResolvedValue(buildCategory());

    await useCase.execute({ name: 'Scrubs' });

    expect(categories.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', name: 'Scrubs', parentId: null }),
    );
  });

  it('throws SlugAlreadyInUseError when the slug is taken', async () => {
    categories.findBySlug.mockResolvedValue(buildCategory());

    await expect(useCase.execute({ name: 'Scrubs' })).rejects.toThrow(SlugAlreadyInUseError);
    expect(categories.create).not.toHaveBeenCalled();
  });

  it('allows nesting up to 3 levels deep', async () => {
    categories.findBySlug.mockResolvedValue(null);
    mockFindById(categories, {
      parent: buildCategory({ id: 'parent', parentId: 'grandparent' }),
      grandparent: buildCategory({ id: 'grandparent', parentId: null }),
    });
    categories.create.mockResolvedValue(buildCategory());

    await useCase.execute({ name: 'Short Sleeve', parentId: 'parent' });

    expect(categories.create).toHaveBeenCalled();
  });

  it('rejects nesting a 4th level deep', async () => {
    categories.findBySlug.mockResolvedValue(null);
    mockFindById(categories, {
      parent: buildCategory({ id: 'parent', parentId: 'grandparent' }),
      grandparent: buildCategory({ id: 'grandparent', parentId: 'great-grandparent' }),
      'great-grandparent': buildCategory({ id: 'great-grandparent', parentId: null }),
    });

    await expect(useCase.execute({ name: 'Too Deep', parentId: 'parent' })).rejects.toThrow(
      CategoryDepthExceededError,
    );
    expect(categories.create).not.toHaveBeenCalled();
  });
});
