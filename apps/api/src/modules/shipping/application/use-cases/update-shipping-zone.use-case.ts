import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingZone } from '../../domain/entities/shipping-zone.entity';
import {
  SHIPPING_ZONE_REPOSITORY,
  type ShippingZoneRepository,
  type UpdateShippingZoneData,
} from '../../domain/repositories/shipping-zone.repository';

export interface UpdateShippingZoneInput extends UpdateShippingZoneData {
  zoneId: string;
}

@Injectable()
export class UpdateShippingZoneUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: UpdateShippingZoneInput): Promise<ShippingZone> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const { zoneId, ...data } = input;
    return this.zones.update(storeId, zoneId, data);
  }
}
