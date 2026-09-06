import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../orders/domain/repositories/order.repository';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

export interface TrackShipmentInput {
  orderNumber: string;
  email: string;
}

/**
 * Customer/guest-facing tracking (ADR 0027) — mirrors this codebase's
 * existing guest-checkout precedent: no account required, ownership
 * verified by matching `orderNumber` + the email snapshot on the order
 * itself, never a customer session. Deliberately returns the same
 * "not found" error whether the order doesn't exist or the email doesn't
 * match, so this can't be used to enumerate valid order numbers.
 */
@Injectable()
export class TrackShipmentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: TrackShipmentInput): Promise<Shipment> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const order = await this.orders.findByOrderNumber(storeId, input.orderNumber);
    if (!order || order.customerEmailSnapshot.toLowerCase() !== input.email.toLowerCase()) {
      throw new ShipmentNotFoundError(input.orderNumber);
    }

    const shipment = await this.shipments.findByOrderId(storeId, order.id);
    if (!shipment) {
      throw new ShipmentNotFoundError(input.orderNumber);
    }
    return shipment;
  }
}
