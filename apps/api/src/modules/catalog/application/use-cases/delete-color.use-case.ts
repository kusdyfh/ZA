import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { COLOR_REPOSITORY, type ColorRepository } from '../../domain/repositories/color.repository';
import { ColorNotFoundError } from '../../domain/errors/catalog.errors';

export interface DeleteColorInput {
  colorId: string;
}

/** ProductVariant.colorId is `onDelete: SetNull` (schema.prisma) — deleting a color un-tags any variants that used it. */
@Injectable()
export class DeleteColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DeleteColorInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const color = await this.colors.findById(storeId, input.colorId);
    if (!color) {
      throw new ColorNotFoundError(input.colorId);
    }
    await this.colors.delete(storeId, color.id);
  }
}
