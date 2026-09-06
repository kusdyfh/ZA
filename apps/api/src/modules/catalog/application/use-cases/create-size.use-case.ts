import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Size } from '../../domain/entities/size.entity';
import { SIZE_REPOSITORY, type SizeRepository } from '../../domain/repositories/size.repository';
import { SizeLabelAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateSizeInput {
  label: string;
  sortOrder?: number;
}

@Injectable()
export class CreateSizeUseCase {
  constructor(
    @Inject(SIZE_REPOSITORY) private readonly sizes: SizeRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateSizeInput): Promise<Size> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const label = Size.validateLabel(input.label);

    const existing = await this.sizes.findByLabel(storeId, label);
    if (existing) {
      throw new SizeLabelAlreadyInUseError(label);
    }

    return this.sizes.create({ storeId, label, sortOrder: input.sortOrder ?? 0 });
  }
}
