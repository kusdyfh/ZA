import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductListFilters,
  type ProductRepository,
} from '../../domain/repositories/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(filters?: ProductListFilters): Promise<Product[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.products.list(storeId, filters);
  }
}
