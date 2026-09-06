import type { OrderItem as OrderItemRecord } from '@prisma/client';
import { OrderItem } from '../../domain/entities/order-item.entity';

export class OrderItemMapper {
  static toDomain(this: void, record: OrderItemRecord): OrderItem {
    return OrderItem.reconstitute({
      id: record.id,
      variantId: record.variantId,
      stockReservationId: record.stockReservationId,
      productNameSnapshot: record.productNameSnapshot,
      skuSnapshot: record.skuSnapshot,
      unitPrice: Number(record.unitPrice),
      quantity: record.quantity,
      lineTotal: Number(record.lineTotal),
    });
  }
}
