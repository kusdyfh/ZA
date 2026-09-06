import type {
  Order as OrderRecord,
  OrderItem as OrderItemRecord,
  OrderStatusHistory as OrderStatusHistoryRecord,
  OrderNote as OrderNoteRecord,
} from '@prisma/client';
import { Order } from '../../domain/entities/order.entity';
import { OrderItemMapper } from './order-item.mapper';
import { OrderStatusHistoryMapper } from './order-status-history.mapper';
import { OrderNoteMapper } from './order-note.mapper';

export type OrderRecordWithRelations = OrderRecord & {
  items: OrderItemRecord[];
  statusHistory: OrderStatusHistoryRecord[];
  notes: OrderNoteRecord[];
};

export class OrderMapper {
  static toDomain(this: void, record: OrderRecordWithRelations): Order {
    return Order.reconstitute({
      id: record.id,
      storeId: record.storeId,
      orderNumber: record.orderNumber,
      status: record.status,
      customerId: record.customerId,
      customerNameSnapshot: record.customerNameSnapshot,
      customerEmailSnapshot: record.customerEmailSnapshot,
      customerPhoneSnapshot: record.customerPhoneSnapshot,
      shippingFullName: record.shippingFullName,
      shippingPhone: record.shippingPhone,
      shippingLine1: record.shippingLine1,
      shippingLine2: record.shippingLine2,
      shippingCity: record.shippingCity,
      shippingGovernorate: record.shippingGovernorate,
      shippingCountry: record.shippingCountry,
      subtotal: Number(record.subtotal),
      discountTotal: Number(record.discountTotal),
      shippingFee: Number(record.shippingFee),
      taxTotal: Number(record.taxTotal),
      total: Number(record.total),
      currencyCode: record.currencyCode,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus,
      shippingMethodId: record.shippingMethodId,
      cancelReason: record.cancelReason,
      items: record.items.map((item) => OrderItemMapper.toDomain(item).toProps()),
      statusHistory: record.statusHistory.map((entry) => OrderStatusHistoryMapper.toDomain(entry).toProps()),
      notes: record.notes.map((note) => OrderNoteMapper.toDomain(note).toProps()),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
