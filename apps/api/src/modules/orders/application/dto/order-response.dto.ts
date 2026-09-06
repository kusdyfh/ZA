import type { Order } from '../../domain/entities/order.entity';
import { OrderItemResponseDto } from './order-item-response.dto';
import { OrderStatusHistoryResponseDto } from './order-status-history-response.dto';
import { OrderNoteResponseDto } from './order-note-response.dto';

export class OrderResponseDto {
  id!: string;
  orderNumber!: string;
  status!: string;

  customerNameSnapshot!: string;
  customerEmailSnapshot!: string;
  customerPhoneSnapshot!: string;

  shippingFullName!: string;
  shippingPhone!: string;
  shippingLine1!: string;
  shippingLine2!: string | null;
  shippingCity!: string;
  shippingGovernorate!: string;
  shippingCountry!: string;

  subtotal!: number;
  discountTotal!: number;
  shippingFee!: number;
  taxTotal!: number;
  total!: number;
  currencyCode!: string;

  paymentMethod!: string;
  paymentStatus!: string;
  shippingMethodId!: string | null;
  cancelReason!: string | null;

  items!: OrderItemResponseDto[];
  statusHistory!: OrderStatusHistoryResponseDto[];
  notes!: OrderNoteResponseDto[];

  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status;
    dto.customerNameSnapshot = order.customerNameSnapshot;
    dto.customerEmailSnapshot = order.customerEmailSnapshot;
    dto.customerPhoneSnapshot = order.customerPhoneSnapshot;
    dto.shippingFullName = order.shippingFullName;
    dto.shippingPhone = order.shippingPhone;
    dto.shippingLine1 = order.shippingLine1;
    dto.shippingLine2 = order.shippingLine2;
    dto.shippingCity = order.shippingCity;
    dto.shippingGovernorate = order.shippingGovernorate;
    dto.shippingCountry = order.shippingCountry;
    dto.subtotal = order.subtotal;
    dto.discountTotal = order.discountTotal;
    dto.shippingFee = order.shippingFee;
    dto.taxTotal = order.taxTotal;
    dto.total = order.total;
    dto.currencyCode = order.currencyCode;
    dto.paymentMethod = order.paymentMethod;
    dto.paymentStatus = order.paymentStatus;
    dto.shippingMethodId = order.shippingMethodId;
    dto.cancelReason = order.cancelReason;
    dto.items = order.items.map((item) => OrderItemResponseDto.fromDomain(item));
    dto.statusHistory = order.statusHistory.map((entry) => OrderStatusHistoryResponseDto.fromDomain(entry));
    dto.notes = order.notes.map((note) => OrderNoteResponseDto.fromDomain(note));
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    return dto;
  }
}
