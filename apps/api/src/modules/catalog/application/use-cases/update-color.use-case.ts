import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Color } from '../../domain/entities/color.entity';
import { COLOR_REPOSITORY, type ColorRepository } from '../../domain/repositories/color.repository';
import { ColorNameAlreadyInUseError, ColorNotFoundError } from '../../domain/errors/catalog.errors';

export interface UpdateColorInput {
  colorId: string;
  name: string;
  hexCode: string;
}

@Injectable()
export class UpdateColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateColorInput): Promise<Color> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const color = await this.colors.findById(storeId, input.colorId);
    if (!color) {
      throw new ColorNotFoundError(input.colorId);
    }

    const name = Color.validateName(input.name);
    if (name !== color.name) {
      const existing = await this.colors.findByName(storeId, name);
      if (existing) {
        throw new ColorNameAlreadyInUseError(name);
      }
    }

    color.rename(name);
    color.changeHexCode(input.hexCode);

    await this.colors.save(color);
    return color;
  }
}
