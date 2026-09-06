import type { ActorRef } from '@za/types';
import type { PaymentStatusHistoryEntry } from '../entities/payment-status-history-entry.entity';
import type { PaymentStatusValue } from '../../../orders/domain/constants/payment-status.constants';

export const PAYMENT_STATUS_HISTORY_REPOSITORY = Symbol('PAYMENT_STATUS_HISTORY_REPOSITORY');

export interface PaymentStatusHistoryRepository {
  append(orderId: string, status: PaymentStatusValue, note: string | null, actor: ActorRef): Promise<PaymentStatusHistoryEntry>;
  listByOrderId(orderId: string): Promise<PaymentStatusHistoryEntry[]>;
}
