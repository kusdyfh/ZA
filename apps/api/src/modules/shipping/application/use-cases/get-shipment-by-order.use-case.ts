import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

/** Customer-facing tracking (ADR 0027) — one shipment per order, so a lookup by orderId is the natural customer-facing key. */
@Injectable()
export class GetShipmentByOrderUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(orderId: string): Promise<Shipment> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const shipment = await this.shipments.findByOrderId(storeId, orderId);
    if (!shipment) {
      throw new ShipmentNotFoundError(orderId);
    }
    return shipment;
  }
}
