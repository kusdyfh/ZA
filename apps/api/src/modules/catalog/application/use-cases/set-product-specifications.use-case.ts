import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PRODUCT_SPECIFICATION_REPOSITORY,
  type ProductSpecificationInput,
  type ProductSpecificationRepository,
} from '../../domain/repositories/product-specification.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface SetProductSpecificationsInput {
  productId: string;
  specifications: ProductSpecificationInput[];
}

@Injectable()
export class SetProductSpecificationsUseCase {
  constructor(
    @Inject(PRODUCT_SPECIFICATION_REPOSITORY)
    private readonly specifications: ProductSpecificationRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetProductSpecificationsInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    await this.specifications.replaceForProduct(input.productId, input.specifications);
  }
}
