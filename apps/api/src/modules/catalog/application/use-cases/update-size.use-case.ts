import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Size } from '../../domain/entities/size.entity';
import { SIZE_REPOSITORY, type SizeRepository } from '../../domain/repositories/size.repository';
import { SizeLabelAlreadyInUseError, SizeNotFoundError } from '../../domain/errors/catalog.errors';

export interface UpdateSizeInput {
  sizeId: string;
  label: string;
  sortOrder?: number;
}

@Injectable()
export class UpdateSizeUseCase {
  constructor(
    @Inject(SIZE_REPOSITORY) private readonly sizes: SizeRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateSizeInput): Promise<Size> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const size = await this.sizes.findById(storeId, input.sizeId);
    if (!size) {
      throw new SizeNotFoundError(input.sizeId);
    }

    const label = Size.validateLabel(input.label);
    if (label !== size.label) {
      const existing = await this.sizes.findByLabel(storeId, label);
      if (existing) {
        throw new SizeLabelAlreadyInUseError(label);
      }
    }

    size.relabel(label);
    size.reorder(input.sortOrder ?? size.sortOrder);

    await this.sizes.save(size);
    return size;
  }
}
