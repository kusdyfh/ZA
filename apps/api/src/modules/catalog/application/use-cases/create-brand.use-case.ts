import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Brand } from '../../domain/entities/brand.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { BRAND_REPOSITORY, type BrandRepository } from '../../domain/repositories/brand.repository';
import { SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string | null;
}

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateBrandInput): Promise<Brand> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Brand.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);

    const existing = await this.brands.findBySlug(storeId, slug.toString());
    if (existing) {
      throw new SlugAlreadyInUseError(slug.toString());
    }

    return this.brands.create({
      storeId,
      name,
      slug,
      description: input.description ?? null,
    });
  }
}
