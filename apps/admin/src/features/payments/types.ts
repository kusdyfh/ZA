export interface PaymentTransaction {
  id: string;
  orderId: string | null;
  provider: string;
  type: string;
  status: string;
  amount: number;
  currencyCode: string;
  providerReference: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PaymentStatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  actorId: string | null;
  actorType: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: string;
  method: string;
  completedAt: string | null;
  createdAt: string;
}

export interface OrderPaymentSummary {
  transactions: PaymentTransaction[];
  statusHistory: PaymentStatusHistoryEntry[];
  refunds: Refund[];
}
