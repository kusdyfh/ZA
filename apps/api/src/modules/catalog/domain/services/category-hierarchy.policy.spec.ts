import { CategoryHierarchyPolicy, type CategoryAncestorRef } from './category-hierarchy.policy';
import { CategoryCycleError, CategoryDepthExceededError, CategoryNotFoundError } from '../errors/catalog.errors';

function makeFinder(categories: CategoryAncestorRef[]) {
  return (id: string): Promise<CategoryAncestorRef | null> =>
    Promise.resolve(categories.find((category) => category.id === id) ?? null);
}

describe('CategoryHierarchyPolicy.loadAncestorChain', () => {
  it('walks up from the starting id to the root', async () => {
    const categories: CategoryAncestorRef[] = [
      { id: 'grandparent', parentId: null },
      { id: 'parent', parentId: 'grandparent' },
    ];
    const chain = await CategoryHierarchyPolicy.loadAncestorChain('parent', makeFinder(categories));
    expect(chain.map((c) => c.id)).toEqual(['parent', 'grandparent']);
  });

  it('throws CategoryNotFoundError when an ancestor id does not exist', async () => {
    await expect(
      CategoryHierarchyPolicy.loadAncestorChain('missing', makeFinder([])),
    ).rejects.toThrow(CategoryNotFoundError);
  });
});

describe('CategoryHierarchyPolicy.validateParentAssignment', () => {
  it('allows a chain shorter than the max depth', () => {
    const chain: CategoryAncestorRef[] = [{ id: 'parent', parentId: null }];
    expect(() => CategoryHierarchyPolicy.validateParentAssignment(null, chain)).not.toThrow();
  });

  it('rejects when the proposed parent chain would exceed the max depth', () => {
    const chain: CategoryAncestorRef[] = [
      { id: 'parent', parentId: 'grandparent' },
      { id: 'grandparent', parentId: 'great-grandparent' },
      { id: 'great-grandparent', parentId: null },
    ];
    expect(() => CategoryHierarchyPolicy.validateParentAssignment(null, chain)).toThrow(
      CategoryDepthExceededError,
    );
  });

  it('rejects assigning a category as a descendant of itself (cycle)', () => {
    const chain: CategoryAncestorRef[] = [
      { id: 'parent', parentId: 'self' },
      { id: 'self', parentId: null },
    ];
    expect(() => CategoryHierarchyPolicy.validateParentAssignment('self', chain)).toThrow(
      CategoryCycleError,
    );
  });

  it('does not check for cycles when creating a new category (categoryId is null)', () => {
    const chain: CategoryAncestorRef[] = [{ id: 'parent', parentId: null }];
    expect(() => CategoryHierarchyPolicy.validateParentAssignment(null, chain)).not.toThrow();
  });
});
