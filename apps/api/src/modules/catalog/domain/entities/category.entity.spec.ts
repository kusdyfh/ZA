import { Category, type CategoryProps } from './category.entity';
import { Slug } from '../value-objects/slug.vo';
import { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { InvalidNameError } from '../errors/catalog.errors';

function buildCategory(overrides: Partial<CategoryProps> = {}): Category {
  const props: CategoryProps = {
    id: 'cat-1',
    storeId: 'store-1',
    name: 'Scrubs',
    slug: Slug.fromRaw('scrubs'),
    description: null,
    sortOrder: 0,
    isActive: true,
    parentId: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Category.reconstitute(props);
}

describe('Category.validateName', () => {
  it('trims and returns a non-empty name', () => {
    expect(Category.validateName('  Scrubs  ')).toBe('Scrubs');
  });

  it('throws for a blank name', () => {
    expect(() => Category.validateName('   ')).toThrow(InvalidNameError);
  });
});

describe('Category mutations', () => {
  it('rename validates and updates the name', () => {
    const category = buildCategory();
    category.rename('Tops');
    expect(category.name).toBe('Tops');
  });

  it('activate/deactivate toggle isActive', () => {
    const category = buildCategory({ isActive: true });
    category.deactivate();
    expect(category.isActive).toBe(false);
    category.activate();
    expect(category.isActive).toBe(true);
  });

  it('reparent updates parentId, including back to null', () => {
    const category = buildCategory({ parentId: null });
    category.reparent('parent-1');
    expect(category.parentId).toBe('parent-1');
    category.reparent(null);
    expect(category.parentId).toBeNull();
  });

  it('reorder updates sortOrder', () => {
    const category = buildCategory({ sortOrder: 0 });
    category.reorder(5);
    expect(category.sortOrder).toBe(5);
  });
});
