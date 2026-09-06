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
import { CategoryNotFoundError, SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface UpdateCategoryInput {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  parentId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const category = await this.categories.findById(storeId, input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    const name = Category.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);
    if (!slug.equals(category.slug)) {
      const existing = await this.categories.findBySlug(storeId, slug.toString());
      if (existing) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    }

    const newParentId = input.parentId ?? null;
    if (newParentId && newParentId !== category.parentId) {
      const parentChain = await CategoryHierarchyPolicy.loadAncestorChain(newParentId, (id) =>
        this.categories.findById(storeId, id),
      );
      CategoryHierarchyPolicy.validateParentAssignment(category.id, parentChain);
    }

    category.rename(name);
    category.changeSlug(slug);
    category.updateDescription(input.description ?? null);
    category.reorder(input.sortOrder ?? category.sortOrder);
    category.reparent(newParentId);
    category.updateSeo(
      SeoMetadata.create({
        metaTitle: input.metaTitle ?? name,
        metaDescription: input.metaDescription ?? input.description ?? null,
      }),
    );

    await this.categories.save(category);
    return category;
  }
}
