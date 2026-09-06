import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../orders/domain/repositories/order.repository';

export interface AssociateGuestOrdersInput {
  customerId: string;
  email: string;
  storeId: string;
}

/**
 * ADR 0018 §4 — "Guest Order Association" realized as an email-match
 * backfill run at register/login time: every pre-existing Order whose
 * `customerEmailSnapshot` matches this email and has no `customerId` yet
 * gets linked. Deliberately not real-time at checkout — see the ADR for
 * why.
 */
@Injectable()
export class AssociateGuestOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: AssociateGuestOrdersInput): Promise<number> {
    return this.orders.associateGuestOrders(input.storeId, input.email, input.customerId);
  }
}
