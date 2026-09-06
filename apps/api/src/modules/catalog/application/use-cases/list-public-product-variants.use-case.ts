import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { PRODUCT_STATUS } from '../../domain/constants/product-status.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import { ListProductVariantsUseCase } from './list-product-variants.use-case';

export interface ListPublicProductVariantsInput {
  productId: string;
}

/**
 * Standalone public variant read (ADR 0021 §2) — also embedded in
 * `GetPublicProductDetailUseCase`'s response; provided separately for a
 * caller that already has a `productId` (e.g. from a list/search
 * result) and only needs the variant matrix. Gates on the parent
 * product being `ACTIVE`, then delegates fully to the existing
 * `ListProductVariantsUseCase`.
 */
@Injectable()
export class ListPublicProductVariantsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
    private readonly listProductVariants: ListProductVariantsUseCase,
  ) {}

  async execute(input: ListPublicProductVariantsInput): Promise<ProductVariant[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new ProductNotFoundError(input.productId);
    }
    return this.listProductVariants.execute({ productId: input.productId });
  }
}
