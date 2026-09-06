import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';
import {
  SHIPPING_RATE_REPOSITORY,
  type ShippingRateRepository,
} from '../../domain/repositories/shipping-rate.repository';

export interface SetShippingRateInput {
  zoneId: string;
  methodId: string;
  fee: number;
  freeShippingThreshold?: number | null;
}

/** Upsert — one rate per (zone, method) pair, per the schema's `@@unique([zoneId, methodId])`. */
@Injectable()
export class SetShippingRateUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetShippingRateInput): Promise<ShippingRate> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.rates.upsert({
      storeId,
      zoneId: input.zoneId,
      methodId: input.methodId,
      fee: input.fee,
      freeShippingThreshold: input.freeShippingThreshold ?? null,
    });
  }
}
