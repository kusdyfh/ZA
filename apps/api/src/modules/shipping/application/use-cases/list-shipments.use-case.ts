import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';

@Injectable()
export class ListShipmentsUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<Shipment[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.shipments.list(storeId);
  }
}
