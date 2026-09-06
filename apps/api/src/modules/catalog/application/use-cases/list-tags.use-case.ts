import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Tag } from '../../domain/entities/tag.entity';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/repositories/tag.repository';

@Injectable()
export class ListTagsUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Tag[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.tags.list(storeId);
  }
}
