import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { ShippingRate } from '../../domain/entities/shipping-rate.entity';
import {
  SHIPPING_RATE_REPOSITORY,
  type ShippingRateRepository,
} from '../../domain/repositories/shipping-rate.repository';

@Injectable()
export class ListShippingRatesUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<ShippingRate[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.rates.list(storeId);
  }
}
