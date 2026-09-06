import { UpdateCategoryUseCase } from './update-category.use-case';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category, type CategoryProps } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import {
  CategoryCycleError,
  CategoryNotFoundError,
  SlugAlreadyInUseError,
} from '../../domain/errors/catalog.errors';

function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  return Category.reconstitute({
    id: overrides.id ?? 'cat-1',
    storeId: 'store-1',
    name: 'Category',
    slug: Slug.fromRaw('category'),
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

describe('UpdateCategoryUseCase', () => {
  let categories: jest.Mocked<CategoryRepository>;
  let storeContext: StoreContext;
  let useCase: UpdateCategoryUseCase;

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
    } as unknown as StoreContext;
    useCase = new UpdateCategoryUseCase(categories, storeContext);
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    categories.findById.mockResolvedValue(null);
    await expect(useCase.execute({ categoryId: 'missing', name: 'X' })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('does not re-check slug uniqueness when the slug is unchanged', async () => {
    const category = buildCategory({ id: 'cat-1' });
    categories.findById.mockResolvedValue(category);

    await useCase.execute({ categoryId: 'cat-1', name: 'Category', slug: 'category' });

    expect(categories.findBySlug).not.toHaveBeenCalled();
    expect(categories.save).toHaveBeenCalled();
  });

  it('throws SlugAlreadyInUseError when changing to a slug already taken by another category', async () => {
    const category = buildCategory({ id: 'cat-1' });
    categories.findById.mockResolvedValue(category);
    categories.findBySlug.mockResolvedValue(buildCategory({ id: 'other' }));

    await expect(
      useCase.execute({ categoryId: 'cat-1', name: 'Category', slug: 'new-slug' }),
    ).rejects.toThrow(SlugAlreadyInUseError);
  });

  it('rejects reparenting a category to be its own descendant', async () => {
    const category = buildCategory({ id: 'cat-1' });
    const childOfCategory = buildCategory({ id: 'child-of-cat-1', parentId: 'cat-1' });
    categories.findById.mockImplementation((_storeId, id) =>
      Promise.resolve(({ 'cat-1': category, 'child-of-cat-1': childOfCategory })[id] ?? null),
    );

    await expect(
      useCase.execute({ categoryId: 'cat-1', name: 'Category', parentId: 'child-of-cat-1' }),
    ).rejects.toThrow(CategoryCycleError);
  });

  it('updates fields and persists via save()', async () => {
    const category = buildCategory({ id: 'cat-1', sortOrder: 0 });
    categories.findById.mockResolvedValue(category);

    const result = await useCase.execute({
      categoryId: 'cat-1',
      name: 'Renamed',
      sortOrder: 3,
    });

    expect(result.name).toBe('Renamed');
    expect(result.sortOrder).toBe(3);
    expect(categories.save).toHaveBeenCalledWith(category);
  });
});
