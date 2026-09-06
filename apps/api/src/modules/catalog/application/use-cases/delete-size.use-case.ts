import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { SIZE_REPOSITORY, type SizeRepository } from '../../domain/repositories/size.repository';
import { SizeNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteSizeInput {
  sizeId: string;
}

/** ProductVariant.sizeId is `onDelete: SetNull` (schema.prisma) — deleting a size un-tags any variants that used it. */
@Injectable()
export class DeleteSizeUseCase {
  constructor(
    @Inject(SIZE_REPOSITORY) private readonly sizes: SizeRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteSizeInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const size = await this.sizes.findById(storeId, input.sizeId);
    if (!size) {
      throw new SizeNotFoundError(input.sizeId);
    }
    await this.sizes.delete(storeId, size.id);
  }
}
