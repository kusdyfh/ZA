import type { ActorRef } from '@za/types';
import type { Refund } from '../entities/refund.entity';
import type { RefundMethodValue, RefundStatusValue } from '../constants/refund-status.constants';

export const REFUND_REPOSITORY = Symbol('REFUND_REPOSITORY');

export interface CreateRefundData {
  storeId: string;
  orderId: string;
  paymentTransactionId?: string | null;
  amount: number;
  reason: string;
  method: RefundMethodValue;
  status: RefundStatusValue;
  requestedBy: ActorRef;
  completedAt?: Date | null;
}

export interface RefundRepository {
  create(data: CreateRefundData): Promise<Refund>;
  listByOrderId(orderId: string): Promise<Refund[]>;
  sumCompletedByOrderId(orderId: string): Promise<number>;
}
