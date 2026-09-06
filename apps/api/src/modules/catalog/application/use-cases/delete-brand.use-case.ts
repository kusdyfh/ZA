import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { BRAND_REPOSITORY, type BrandRepository } from '../../domain/repositories/brand.repository';
import { BrandNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteBrandInput {
  brandId: string;
}

/**
 * No order-history-style restriction — Product.brandId is `onDelete:
 * SetNull` (schema.prisma), so deleting a Brand simply un-brands any
 * products that referenced it rather than blocking or cascading.
 */
@Injectable()
export class DeleteBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteBrandInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const brand = await this.brands.findById(storeId, input.brandId);
    if (!brand) {
      throw new BrandNotFoundError(input.brandId);
    }
    await this.brands.delete(storeId, brand.id);
  }
}
