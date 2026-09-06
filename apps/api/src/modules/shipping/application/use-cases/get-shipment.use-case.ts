import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';

@Injectable()
export class GetShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(shipmentId: string): Promise<Shipment> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const shipment = await this.shipments.findById(storeId, shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }
    return shipment;
  }
}
