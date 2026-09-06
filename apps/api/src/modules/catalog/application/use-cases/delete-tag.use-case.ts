import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/repositories/tag.repository';
import { TagNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteTagInput {
  tagId: string;
}

/** ProductTag is `onDelete: Cascade` (schema.prisma) — deleting a tag just removes the associations. */
@Injectable()
export class DeleteTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteTagInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const tag = await this.tags.findById(storeId, input.tagId);
    if (!tag) {
      throw new TagNotFoundError(input.tagId);
    }
    await this.tags.delete(storeId, tag.id);
  }
}
