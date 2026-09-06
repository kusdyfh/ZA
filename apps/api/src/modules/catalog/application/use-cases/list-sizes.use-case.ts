import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Size } from '../../domain/entities/size.entity';
import { SIZE_REPOSITORY, type SizeRepository } from '../../domain/repositories/size.repository';

@Injectable()
export class ListSizesUseCase {
  constructor(
    @Inject(SIZE_REPOSITORY) private readonly sizes: SizeRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Size[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.sizes.list(storeId);
  }
}
