import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category } from '../../domain/entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Category[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.categories.list(storeId);
  }
}
