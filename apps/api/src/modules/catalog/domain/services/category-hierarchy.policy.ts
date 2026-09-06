import { CategoryCycleError, CategoryDepthExceededError, CategoryNotFoundError } from '../errors/catalog.errors';

/** 3 levels deep, per docs/product/04-CATEGORIES.md. */
export const CATEGORY_MAX_DEPTH = 3;

export interface CategoryAncestorRef {
  id: string;
  parentId: string | null;
}

/**
 * Depth/cycle validation is pure; walking the ancestor chain needs
 * repository access, which this accepts as an injected `findById`
 * function rather than importing a concrete repository — keeps this
 * class unit-testable with a plain in-memory map instead of a mocked
 * NestJS provider.
 */
export class CategoryHierarchyPolicy {
  static async loadAncestorChain(
    startParentId: string,
    findById: (id: string) => Promise<CategoryAncestorRef | null>,
  ): Promise<CategoryAncestorRef[]> {
    const chain: CategoryAncestorRef[] = [];
    let currentId: string | null = startParentId;

    while (currentId) {
      const current = await findById(currentId);
      if (!current) {
        throw new CategoryNotFoundError(currentId);
      }
      chain.push(current);
      if (chain.length > CATEGORY_MAX_DEPTH) {
        break;
      }
      currentId = current.parentId;
    }

    return chain;
  }

  /**
   * @param categoryId The category being (re)parented, or null when creating a new one.
   * @param proposedParentChain The proposed parent, then its parent, then its parent's parent, etc — nearest first.
   */
  static validateParentAssignment(categoryId: string | null, proposedParentChain: CategoryAncestorRef[]): void {
    if (categoryId && proposedParentChain.some((ancestor) => ancestor.id === categoryId)) {
      throw new CategoryCycleError();
    }
    if (proposedParentChain.length >= CATEGORY_MAX_DEPTH) {
      throw new CategoryDepthExceededError();
    }
  }
}
