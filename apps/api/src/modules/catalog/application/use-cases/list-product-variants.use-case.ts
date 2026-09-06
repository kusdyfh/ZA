import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import {
  PRODUCT_VARIANT_REPOSITORY,
  type ProductVariantRepository,
} from '../../domain/repositories/product-variant.repository';

export interface ListProductVariantsInput {
  productId: string;
}

@Injectable()
export class ListProductVariantsUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ListProductVariantsInput): Promise<ProductVariant[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.variants.listByProduct(storeId, input.productId);
  }
}
