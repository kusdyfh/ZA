import { ActorType } from '@za/types';
import { Shipment, type ShipmentProps } from './shipment.entity';
import { SHIPMENT_STATUS } from '../constants/shipment-status.constants';

function buildShipment(overrides: Partial<ShipmentProps> = {}): Shipment {
  const props: ShipmentProps = {
    id: 'shipment-1',
    storeId: 'store-1',
    orderId: 'order-1',
    shippingMethodId: 'method-1',
    status: SHIPMENT_STATUS.PENDING,
    carrierName: null,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    dispatchedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-08-05T12:00:00Z'),
    updatedAt: new Date('2026-08-05T12:00:00Z'),
    trackingEvents: [
      {
        id: 'evt-1',
        shipmentId: 'shipment-1',
        status: SHIPMENT_STATUS.PENDING,
        note: 'Shipment created.',
        location: null,
        actorId: null,
        actorType: ActorType.SYSTEM,
        createdAt: new Date('2026-08-05T12:00:00Z'),
      },
    ],
    ...overrides,
  };
  return Shipment.reconstitute(props);
}

describe('Shipment', () => {
  it('exposes every scalar field via getters', () => {
    const shipment = buildShipment();
    expect(shipment.id).toBe('shipment-1');
    expect(shipment.storeId).toBe('store-1');
    expect(shipment.orderId).toBe('order-1');
    expect(shipment.shippingMethodId).toBe('method-1');
    expect(shipment.status).toBe(SHIPMENT_STATUS.PENDING);
    expect(shipment.carrierName).toBeNull();
    expect(shipment.trackingNumber).toBeNull();
    expect(shipment.trackingUrl).toBeNull();
    expect(shipment.labelUrl).toBeNull();
    expect(shipment.dispatchedAt).toBeNull();
    expect(shipment.deliveredAt).toBeNull();
    expect(shipment.createdAt).toEqual(new Date('2026-08-05T12:00:00Z'));
    expect(shipment.updatedAt).toEqual(new Date('2026-08-05T12:00:00Z'));
  });

  it('reflects a dispatched shipment', () => {
    const dispatchedAt = new Date('2026-08-06T09:00:00Z');
    const shipment = buildShipment({
      status: SHIPMENT_STATUS.IN_TRANSIT,
      carrierName: 'Aramex',
      trackingNumber: 'TRK-12345',
      trackingUrl: 'https://track.example.com/TRK-12345',
      dispatchedAt,
    });
    expect(shipment.status).toBe(SHIPMENT_STATUS.IN_TRANSIT);
    expect(shipment.carrierName).toBe('Aramex');
    expect(shipment.trackingNumber).toBe('TRK-12345');
    expect(shipment.trackingUrl).toBe('https://track.example.com/TRK-12345');
    expect(shipment.dispatchedAt).toEqual(dispatchedAt);
  });

  it('reconstitutes its tracking events as ShipmentTrackingEvent instances', () => {
    const shipment = buildShipment();
    expect(shipment.trackingEvents).toHaveLength(1);
    expect(shipment.trackingEvents[0]!.status).toBe(SHIPMENT_STATUS.PENDING);
    expect(shipment.trackingEvents[0]!.note).toBe('Shipment created.');
  });

  it('supports a null shippingMethodId (order placed before a method was chosen)', () => {
    const shipment = buildShipment({ shippingMethodId: null });
    expect(shipment.shippingMethodId).toBeNull();
  });

  it('toProps returns an equivalent plain object', () => {
    const props: ShipmentProps = {
      id: 'shipment-2',
      storeId: 'store-1',
      orderId: 'order-2',
      shippingMethodId: null,
      status: SHIPMENT_STATUS.PENDING,
      carrierName: null,
      trackingNumber: null,
      trackingUrl: null,
      labelUrl: null,
      dispatchedAt: null,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trackingEvents: [],
    };
    const shipment = Shipment.reconstitute(props);
    expect(shipment.toProps()).toEqual(props);
  });

  it('is immutable — no mutator methods exist', () => {
    const shipment = buildShipment() as unknown as Record<string, unknown>;
    expect(shipment.dispatch).toBeUndefined();
    expect(shipment.markDelivered).toBeUndefined();
    expect(shipment.transitionTo).toBeUndefined();
  });
});
