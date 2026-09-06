import { Injectable } from '@nestjs/common';
import type {
  CreateLabelInput,
  ShippingLabelResult,
  ShippingProviderPort,
} from '../../domain/ports/shipping-provider.port';

/**
 * The only Shipping provider this epic implements (ADR 0027) —
 * `docs/product/11-SHIPPING.md` names real carrier integration as
 * explicitly out of scope for v1. `createLabel()` never calls an external
 * API; the tracking number is staff-entered (`DispatchShipmentUseCase`),
 * not generated here.
 */
@Injectable()
export class ManualShippingProvider implements ShippingProviderPort {
  readonly provider = 'MANUAL' as const;

  createLabel(_input: CreateLabelInput): Promise<ShippingLabelResult> {
    return Promise.resolve({ labelUrl: null, trackingUrl: null });
  }
}
