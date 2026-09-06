import { DeleteCategoryUseCase } from './delete-category.use-case';
import type { CategoryRepository } from '../../domain/repositories/category.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category, type CategoryProps } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import { CategoryNotEmptyError, CategoryNotFoundError } from '../../domain/errors/catalog.errors';

function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  return Category.reconstitute({
    id: 'cat-1',
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

describe('DeleteCategoryUseCase', () => {
  let categories: jest.Mocked<CategoryRepository>;
  let storeContext: StoreContext;
  let useCase: DeleteCategoryUseCase;

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
    useCase = new DeleteCategoryUseCase(categories, storeContext);
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    categories.findById.mockResolvedValue(null);
    await expect(useCase.execute({ categoryId: 'missing' })).rejects.toThrow(CategoryNotFoundError);
  });

  it('throws CategoryNotEmptyError when the category has subcategories', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    categories.countChildren.mockResolvedValue(1);
    categories.countProducts.mockResolvedValue(0);

    await expect(useCase.execute({ categoryId: 'cat-1' })).rejects.toThrow(CategoryNotEmptyError);
    expect(categories.delete).not.toHaveBeenCalled();
  });

  it('throws CategoryNotEmptyError when the category has products', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    categories.countChildren.mockResolvedValue(0);
    categories.countProducts.mockResolvedValue(1);

    await expect(useCase.execute({ categoryId: 'cat-1' })).rejects.toThrow(CategoryNotEmptyError);
  });

  it('deletes an empty category', async () => {
    categories.findById.mockResolvedValue(buildCategory());
    categories.countChildren.mockResolvedValue(0);
    categories.countProducts.mockResolvedValue(0);

    await useCase.execute({ categoryId: 'cat-1' });

    expect(categories.delete).toHaveBeenCalledWith('store-1', 'cat-1');
  });
});
