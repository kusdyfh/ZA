import type { Color } from '../../domain/entities/color.entity';

export class ColorResponseDto {
  id!: string;
  name!: string;
  hexCode!: string;

  static fromDomain(color: Color): ColorResponseDto {
    const dto = new ColorResponseDto();
    dto.id = color.id;
    dto.name = color.name;
    dto.hexCode = color.hexCode;
    return dto;
  }
}
