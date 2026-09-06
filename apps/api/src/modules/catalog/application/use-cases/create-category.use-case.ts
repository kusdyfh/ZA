import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Category } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { SeoMetadata } from '../../domain/value-objects/seo-metadata.vo';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/repositories/category.repository';
import { CategoryHierarchyPolicy } from '../../domain/services/category-hierarchy.policy';
import { SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  parentId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Category.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);

    const existing = await this.categories.findBySlug(storeId, slug.toString());
    if (existing) {
      throw new SlugAlreadyInUseError(slug.toString());
    }

    if (input.parentId) {
      const parentChain = await CategoryHierarchyPolicy.loadAncestorChain(input.parentId, (id) =>
        this.categories.findById(storeId, id),
      );
      CategoryHierarchyPolicy.validateParentAssignment(null, parentChain);
    }

    const seo = SeoMetadata.create({
      metaTitle: input.metaTitle ?? name,
      metaDescription: input.metaDescription ?? input.description ?? null,
    });

    return this.categories.create({
      storeId,
      name,
      slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      parentId: input.parentId ?? null,
      seo,
    });
  }
}
