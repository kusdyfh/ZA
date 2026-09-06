import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category } from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';
import { CategoryNotFoundError } from '../../domain/errors/catalog.errors';

export interface SetCategoryActiveInput {
  categoryId: string;
  isActive: boolean;
}

@Injectable()
export class SetCategoryActiveUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetCategoryActiveInput): Promise<Category> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const category = await this.categories.findById(storeId, input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    if (input.isActive) {
      category.activate();
    } else {
      category.deactivate();
    }

    await this.categories.save(category);
    return category;
  }
}
