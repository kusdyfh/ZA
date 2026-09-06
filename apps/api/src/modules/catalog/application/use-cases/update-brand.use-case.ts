import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Brand } from '../../domain/entities/brand.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { BRAND_REPOSITORY, type BrandRepository } from '../../domain/repositories/brand.repository';
import { BrandNotFoundError, SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface UpdateBrandInput {
  brandId: string;
  name: string;
  slug?: string;
  description?: string | null;
}

@Injectable()
export class UpdateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateBrandInput): Promise<Brand> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const brand = await this.brands.findById(storeId, input.brandId);
    if (!brand) {
      throw new BrandNotFoundError(input.brandId);
    }

    const name = Brand.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);
    if (!slug.equals(brand.slug)) {
      const existing = await this.brands.findBySlug(storeId, slug.toString());
      if (existing) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    }

    brand.rename(name);
    brand.changeSlug(slug);
    brand.updateDescription(input.description ?? null);

    await this.brands.save(brand);
    return brand;
  }
}
