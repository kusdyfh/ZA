import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category } from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
}

/** Pure — exported so it's unit-testable without a repository mock. */
export function buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryTreeNode[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      category,
      children: buildCategoryTree(categories, category.id),
    }));
}

@Injectable()
export class GetCategoryTreeUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<CategoryTreeNode[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const all = await this.categories.list(storeId);
    return buildCategoryTree(all);
  }
}
