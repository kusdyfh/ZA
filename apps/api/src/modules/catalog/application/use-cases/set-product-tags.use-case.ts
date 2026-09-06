import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/repositories/product.repository';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/repositories/tag.repository';
import { ProductNotFoundError, TagNotFoundError } from '../../domain/errors/catalog.errors';

export interface SetProductTagsInput {
  productId: string;
  tagIds: string[];
}

/** Replaces a product's full tag set — matches "assign to any number of tags" as one operation. */
@Injectable()
export class SetProductTagsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetProductTagsInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const uniqueIds = [...new Set(input.tagIds)];
    const found = await this.tags.findManyByIds(storeId, uniqueIds);
    const foundIds = new Set(found.map((tag) => tag.id));
    const missing = uniqueIds.find((id) => !foundIds.has(id));
    if (missing) {
      throw new TagNotFoundError(missing);
    }

    await this.products.replaceTags(storeId, product.id, uniqueIds);
  }
}
