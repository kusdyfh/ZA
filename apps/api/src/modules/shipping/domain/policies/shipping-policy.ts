import { SHIPMENT_STATUS, type ShipmentStatusValue } from '../constants/shipment-status.constants';
import { IllegalShipmentStatusTransitionError, TrackingNumberRequiredError } from '../errors/shipping.errors';

/**
 * The legal Shipment status graph (ADR 0027) — flat, staff-driven, no
 * carrier webhook. `DispatchShipmentUseCase` creates the (placeholder)
 * label and moves straight to `IN_TRANSIT` in one action — there is no
 * separate "label printed, not yet handed to carrier" step in this
 * epic's scope, so `PENDING` transitions directly to `IN_TRANSIT`.
 * `LABEL_CREATED` remains a reserved enum value for a future carrier
 * integration that creates a real, standalone label step.
 */
const LEGAL_TRANSITIONS: Record<ShipmentStatusValue, readonly ShipmentStatusValue[]> = {
  [SHIPMENT_STATUS.PENDING]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.FAILED],
  [SHIPMENT_STATUS.LABEL_CREATED]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.FAILED],
  [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.FAILED],
  [SHIPMENT_STATUS.DELIVERED]: [SHIPMENT_STATUS.RETURNED],
  [SHIPMENT_STATUS.FAILED]: [],
  [SHIPMENT_STATUS.RETURNED]: [],
};

/** The single home for every Shipping business rule, mirroring OrderPolicy/InventoryPolicy/PaymentPolicy. */
export class ShippingPolicy {
  static assertValidTransition(from: ShipmentStatusValue, to: ShipmentStatusValue): void {
    if (!LEGAL_TRANSITIONS[from].includes(to)) {
      throw new IllegalShipmentStatusTransitionError(from, to);
    }
  }

  static assertTrackingNumberProvided(trackingNumber: string | null | undefined): void {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new TrackingNumberRequiredError();
    }
  }
}
