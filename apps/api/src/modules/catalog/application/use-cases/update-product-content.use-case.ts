import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';

export interface UpdateProductContentInput {
  productId: string;
  highlights?: string[];
  richContent?: string | null;
}

@Injectable()
export class UpdateProductContentUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateProductContentInput): Promise<Product> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    if (input.highlights !== undefined) {
      product.updateHighlights(input.highlights);
    }
    if (input.richContent !== undefined) {
      product.updateRichContent(input.richContent);
    }

    await this.products.save(product);
    return product;
  }
}
