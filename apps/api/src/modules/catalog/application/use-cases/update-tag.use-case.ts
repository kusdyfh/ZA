import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Tag } from '../../domain/entities/tag.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/repositories/tag.repository';
import { SlugAlreadyInUseError, TagNotFoundError } from '../../domain/errors/catalog.errors';

export interface UpdateTagInput {
  tagId: string;
  name: string;
  slug?: string;
}

@Injectable()
export class UpdateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateTagInput): Promise<Tag> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const tag = await this.tags.findById(storeId, input.tagId);
    if (!tag) {
      throw new TagNotFoundError(input.tagId);
    }

    const name = Tag.validateName(input.name);
    const slug = input.slug ? Slug.fromRaw(input.slug) : Slug.fromName(name);
    if (!slug.equals(tag.slug)) {
      const existing = await this.tags.findBySlug(storeId, slug.toString());
      if (existing) {
        throw new SlugAlreadyInUseError(slug.toString());
      }
    }

    tag.rename(name);
    tag.changeSlug(slug);

    await this.tags.save(tag);
    return tag;
  }
}
