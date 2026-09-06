import type { OrderItem } from '../../domain/entities/order-item.entity';

export class OrderItemResponseDto {
  id!: string;
  variantId!: string | null;
  stockReservationId!: string;
  productNameSnapshot!: string;
  skuSnapshot!: string;
  unitPrice!: number;
  quantity!: number;
  lineTotal!: number;

  static fromDomain(item: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.id = item.id;
    dto.variantId = item.variantId;
    dto.stockReservationId = item.stockReservationId;
    dto.productNameSnapshot = item.productNameSnapshot;
    dto.skuSnapshot = item.skuSnapshot;
    dto.unitPrice = item.unitPrice;
    dto.quantity = item.quantity;
    dto.lineTotal = item.lineTotal;
    return dto;
  }
}
