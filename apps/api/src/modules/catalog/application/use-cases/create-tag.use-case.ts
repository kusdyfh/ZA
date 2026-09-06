import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Tag } from '../../domain/entities/tag.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/repositories/tag.repository';
import { SlugAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateTagInput {
  name: string;
  slug?: string;
}

@Injectable()
export class CreateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateTagInput): Promise<Tag> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Tag.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);

    const existing = await this.tags.findBySlug(storeId, slug.toString());
    if (existing) {
      throw new SlugAlreadyInUseError(slug.toString());
    }

    return this.tags.create({ storeId, name, slug });
  }
}
