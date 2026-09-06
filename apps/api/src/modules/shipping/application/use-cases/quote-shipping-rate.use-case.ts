import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  SHIPPING_ZONE_REPOSITORY,
  type ShippingZoneRepository,
} from '../../domain/repositories/shipping-zone.repository';
import {
  SHIPPING_RATE_REPOSITORY,
  type ShippingRateRepository,
} from '../../domain/repositories/shipping-rate.repository';
import {
  SHIPPING_METHOD_REPOSITORY,
  type ShippingMethodRepository,
} from '../../domain/repositories/shipping-method.repository';
import { UnsupportedDeliveryRegionError, ShippingRateNotFoundError } from '../../domain/errors/shipping.errors';

export interface QuoteShippingRateInput {
  governorate: string;
  methodId: string;
  subtotal: number;
  discountTotal: number;
}

export interface QuoteShippingRateResult {
  fee: number;
  zoneId: string;
  estimatedDays: { min: number; max: number } | null;
}

/**
 * Replaces `OrderPolicy.STANDARD_SHIPPING_FEE` (ADR 0027) — resolves the
 * zone from the shipping governorate (a plain array-contains lookup, not
 * geocoding), then the rate for that (zone, method) pair, then applies the
 * free-shipping threshold against the *discounted* subtotal. Called from
 * checkout **before** `PlaceOrderUseCase`/`InitiateCardCheckoutUseCase` run
 * at all — "checkout blocks addresses outside supported delivery regions...
 * before proceeding" (docs/product/11-SHIPPING.md).
 */
@Injectable()
export class QuoteShippingRateUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepository,
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepository,
    @Inject(SHIPPING_METHOD_REPOSITORY) private readonly methods: ShippingMethodRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: QuoteShippingRateInput): Promise<QuoteShippingRateResult> {
    const storeId = await this.storeContext.getCurrentStoreId();

    const zone = await this.zones.findByGovernorate(storeId, input.governorate);
    if (!zone) {
      throw new UnsupportedDeliveryRegionError(input.governorate);
    }

    const rate = await this.rates.findByZoneAndMethod(storeId, zone.id, input.methodId);
    if (!rate || !rate.isActive) {
      throw new ShippingRateNotFoundError();
    }

    const method = await this.methods.findById(storeId, input.methodId);
    const netSubtotal = input.subtotal - input.discountTotal;
    const fee = rate.computeFee(netSubtotal);

    return {
      fee,
      zoneId: zone.id,
      estimatedDays: method ? { min: method.minDays, max: method.maxDays } : null,
    };
  }
}
