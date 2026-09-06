import { buildCategoryTree } from './get-category-tree.use-case';
import { Category, type CategoryProps } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';

function buildCategory(overrides: Partial<CategoryProps>): Category {
  return Category.reconstitute({
    id: overrides.id ?? 'id',
    storeId: 'store-1',
    name: overrides.id ?? 'name',
    slug: Slug.fromRaw(overrides.id ?? 'slug'),
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

describe('buildCategoryTree', () => {
  it('nests children under their parent, sorted by sortOrder', () => {
    const categories = [
      buildCategory({ id: 'scrubs', parentId: null, sortOrder: 0 }),
      buildCategory({ id: 'lab-coats', parentId: null, sortOrder: 1 }),
      buildCategory({ id: 'bottoms', parentId: 'scrubs', sortOrder: 1 }),
      buildCategory({ id: 'tops', parentId: 'scrubs', sortOrder: 0 }),
    ];

    const tree = buildCategoryTree(categories);

    expect(tree.map((node) => node.category.id)).toEqual(['scrubs', 'lab-coats']);
    expect(tree[0]?.children.map((node) => node.category.id)).toEqual(['tops', 'bottoms']);
    expect(tree[1]?.children).toEqual([]);
  });

  it('nests a third level correctly', () => {
    const categories = [
      buildCategory({ id: 'scrubs', parentId: null }),
      buildCategory({ id: 'tops', parentId: 'scrubs' }),
      buildCategory({ id: 'short-sleeve', parentId: 'tops' }),
    ];

    const tree = buildCategoryTree(categories);

    expect(tree[0]?.children[0]?.children.map((node) => node.category.id)).toEqual(['short-sleeve']);
  });
});
