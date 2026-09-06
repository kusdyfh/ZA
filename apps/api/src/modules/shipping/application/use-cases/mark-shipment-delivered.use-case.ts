import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';
import { AdvanceOrderStatusUseCase } from '../../../orders/application/use-cases/advance-order-status.use-case';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';

export interface MarkShipmentDeliveredInput {
  shipmentId: string;
  actor: ActorRef;
}

/**
 * Staff-driven (ADR 0027) — no carrier webhook exists to call this
 * automatically, per the disclosed scope boundary. Also advances the
 * linked `Order` to `DELIVERED` via the existing, unmodified
 * `AdvanceOrderStatusUseCase`.
 */
@Injectable()
export class MarkShipmentDeliveredUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly advanceOrderStatus: AdvanceOrderStatusUseCase,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: MarkShipmentDeliveredInput): Promise<Shipment> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const existing = await this.shipments.findById(storeId, input.shipmentId);
    if (!existing) {
      throw new ShipmentNotFoundError(input.shipmentId);
    }

    const shipment = await this.shipments.markDelivered(input.shipmentId, input.actor);

    await this.advanceOrderStatus.execute({ orderId: shipment.orderId, status: ORDER_STATUS.DELIVERED, actor: input.actor });

    return shipment;
  }
}
