import type { VariantStock } from '../../domain/entities/variant-stock.entity';

export class VariantStockResponseDto {
  variantId!: string;
  warehouseId!: string;
  quantity!: number;
  available!: number;
  lowStockThreshold!: number | null;
  isLowStock!: boolean;

  static fromDomain(
    variantStock: VariantStock,
    available: number,
    isLowStock: boolean,
  ): VariantStockResponseDto {
    const dto = new VariantStockResponseDto();
    dto.variantId = variantStock.variantId;
    dto.warehouseId = variantStock.warehouseId;
    dto.quantity = variantStock.quantity;
    dto.available = available;
    dto.lowStockThreshold = variantStock.lowStockThreshold;
    dto.isLowStock = isLowStock;
    return dto;
  }
}
