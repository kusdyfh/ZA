import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { OrderPolicy } from '../../domain/policies/order-policy';

export interface AddOrderNoteInput {
  orderId: string;
  body: string;
  isInternal?: boolean;
  actor: ActorRef;
}

/** docs/product/07-ORDERS.md: internal (staff-only) or customer-visible notes. */
@Injectable()
export class AddOrderNoteUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: AddOrderNoteInput): Promise<Order> {
    OrderPolicy.assertNonEmptyNote(input.body);
    return this.orders.addNote(input.orderId, input.body, input.isInternal ?? true, input.actor);
  }
}
