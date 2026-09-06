import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Color } from '../../domain/entities/color.entity';
import { COLOR_REPOSITORY, type ColorRepository } from '../../domain/repositories/color.repository';
import { ColorNameAlreadyInUseError } from '../../domain/errors/catalog.errors';

export interface CreateColorInput {
  name: string;
  hexCode: string;
}

@Injectable()
export class CreateColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY) private readonly colors: ColorRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: CreateColorInput): Promise<Color> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const name = Color.validateName(input.name);
    const hexCode = Color.validateHexCode(input.hexCode);

    const existing = await this.colors.findByName(storeId, name);
    if (existing) {
      throw new ColorNameAlreadyInUseError(name);
    }

    return this.colors.create({ storeId, name, hexCode });
  }
}
