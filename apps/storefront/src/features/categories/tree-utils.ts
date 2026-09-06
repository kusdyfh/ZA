import type { Category, CategoryTreeNode } from './types';

/** No `GET /categories/:slug` endpoint exists — the tree is the only source that carries every category, so a slug lookup means searching it in memory (a pure lookup, not fabricated data). */
export function findCategoryBySlug(tree: CategoryTreeNode[], slug: string): Category | null {
  for (const node of tree) {
    if (node.category.slug === slug) {
      return node.category;
    }
    const found = findCategoryBySlug(node.children, slug);
    if (found) {
      return found;
    }
  }
  return null;
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): Category[] {
  return tree.flatMap((node) => [node.category, ...flattenCategoryTree(node.children)]);
}
