import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Brand } from '../../domain/entities/brand.entity';
import { BRAND_REPOSITORY, type BrandRepository } from '../../domain/repositories/brand.repository';

@Injectable()
export class ListBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Brand[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.brands.list(storeId);
  }
}
