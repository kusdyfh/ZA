import { ShippingPolicy } from './shipping-policy';
import { SHIPMENT_STATUS } from '../constants/shipment-status.constants';
import { IllegalShipmentStatusTransitionError, TrackingNumberRequiredError } from '../errors/shipping.errors';

describe('ShippingPolicy.assertValidTransition', () => {
  const legalTransitions: [string, string][] = [
    // PENDING skips LABEL_CREATED entirely — DispatchShipmentUseCase moves
    // straight to IN_TRANSIT in one action; LABEL_CREATED is a reserved
    // enum value for a future real-carrier integration (see the policy's
    // own doc comment).
    [SHIPMENT_STATUS.PENDING, SHIPMENT_STATUS.IN_TRANSIT],
    [SHIPMENT_STATUS.PENDING, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.LABEL_CREATED, SHIPMENT_STATUS.IN_TRANSIT],
    [SHIPMENT_STATUS.LABEL_CREATED, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.DELIVERED],
    [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.FAILED],
    [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.RETURNED],
  ];

  it.each(legalTransitions)('allows %s -> %s', (from, to) => {
    expect(() => ShippingPolicy.assertValidTransition(from as never, to as never)).not.toThrow();
  });

  it('rejects PENDING straight to DELIVERED (skipping IN_TRANSIT)', () => {
    expect(() =>
      ShippingPolicy.assertValidTransition(SHIPMENT_STATUS.PENDING, SHIPMENT_STATUS.DELIVERED),
    ).toThrow(IllegalShipmentStatusTransitionError);
  });

  it('rejects moving backward (e.g. IN_TRANSIT back to PENDING)', () => {
    expect(() =>
      ShippingPolicy.assertValidTransition(SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.PENDING),
    ).toThrow(IllegalShipmentStatusTransitionError);
  });

  it('rejects any transition out of FAILED — terminal', () => {
    expect(() =>
      ShippingPolicy.assertValidTransition(SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.PENDING),
    ).toThrow(IllegalShipmentStatusTransitionError);
  });

  it('rejects any transition out of RETURNED — terminal', () => {
    expect(() =>
      ShippingPolicy.assertValidTransition(SHIPMENT_STATUS.RETURNED, SHIPMENT_STATUS.PENDING),
    ).toThrow(IllegalShipmentStatusTransitionError);
  });

  it('rejects moving a DELIVERED shipment anywhere except RETURNED', () => {
    expect(() =>
      ShippingPolicy.assertValidTransition(SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.IN_TRANSIT),
    ).toThrow(IllegalShipmentStatusTransitionError);
  });
});

describe('ShippingPolicy.assertTrackingNumberProvided', () => {
  it('allows a non-empty tracking number', () => {
    expect(() => ShippingPolicy.assertTrackingNumberProvided('TRK-12345')).not.toThrow();
  });

  it('rejects an empty, whitespace, or missing tracking number', () => {
    expect(() => ShippingPolicy.assertTrackingNumberProvided('')).toThrow(TrackingNumberRequiredError);
    expect(() => ShippingPolicy.assertTrackingNumberProvided('   ')).toThrow(TrackingNumberRequiredError);
    expect(() => ShippingPolicy.assertTrackingNumberProvided(undefined)).toThrow(TrackingNumberRequiredError);
    expect(() => ShippingPolicy.assertTrackingNumberProvided(null)).toThrow(TrackingNumberRequiredError);
  });
});
