import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';
import { CategoryNotEmptyError, CategoryNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteCategoryInput {
  categoryId: string;
}

/** Enforces docs/product/04-CATEGORIES.md: cannot delete a non-empty category. */
@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const category = await this.categories.findById(storeId, input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    const [childCount, productCount] = await Promise.all([
      this.categories.countChildren(storeId, category.id),
      this.categories.countProducts(storeId, category.id),
    ]);

    if (childCount > 0 || productCount > 0) {
      throw new CategoryNotEmptyError();
    }

    await this.categories.delete(storeId, category.id);
  }
}
