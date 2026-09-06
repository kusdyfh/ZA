import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Color } from '../../domain/entities/color.entity';
import { COLOR_REPOSITORY, type ColorRepository } from '../../domain/repositories/color.repository';

@Injectable()
export class ListColorsUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Color[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.colors.list(storeId);
  }
}
