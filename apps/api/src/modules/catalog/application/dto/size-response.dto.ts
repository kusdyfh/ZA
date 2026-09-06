import type { Size } from '../../domain/entities/size.entity';

export class SizeResponseDto {
  id!: string;
  label!: string;
  sortOrder!: number;

  static fromDomain(size: Size): SizeResponseDto {
    const dto = new SizeResponseDto();
    dto.id = size.id;
    dto.label = size.label;
    dto.sortOrder = size.sortOrder;
    return dto;
  }
}
