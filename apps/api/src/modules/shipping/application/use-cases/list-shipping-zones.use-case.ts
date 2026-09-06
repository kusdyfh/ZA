import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';
import {
  SHIPPING_ZONE_REPOSITORY,
  type ShippingZoneRepository,
} from '../../domain/repositories/shipping-zone.repository';

@Injectable()
export class ListShippingZonesUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<ShippingZone[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.zones.list(storeId);
  }
}
