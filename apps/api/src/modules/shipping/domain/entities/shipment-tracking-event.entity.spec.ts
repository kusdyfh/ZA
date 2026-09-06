import { ActorType } from '@za/types';
import { ShipmentTrackingEvent, type ShipmentTrackingEventProps } from './shipment-tracking-event.entity';
import { SHIPMENT_STATUS } from '../constants/shipment-status.constants';

function buildEvent(overrides: Partial<ShipmentTrackingEventProps> = {}): ShipmentTrackingEvent {
  const props: ShipmentTrackingEventProps = {
    id: 'evt-1',
    shipmentId: 'shipment-1',
    status: SHIPMENT_STATUS.PENDING,
    note: 'Shipment created.',
    location: null,
    actorId: null,
    actorType: ActorType.SYSTEM,
    createdAt: new Date(),
    ...overrides,
  };
  return ShipmentTrackingEvent.reconstitute(props);
}

describe('ShipmentTrackingEvent', () => {
  it('exposes every field via getters', () => {
    const event = buildEvent();
    expect(event.shipmentId).toBe('shipment-1');
    expect(event.status).toBe(SHIPMENT_STATUS.PENDING);
    expect(event.note).toBe('Shipment created.');
    expect(event.location).toBeNull();
    expect(event.actorType).toBe(ActorType.SYSTEM);
  });

  it('allows a location and admin actor', () => {
    const event = buildEvent({ location: 'Baghdad Sorting Hub', actorId: 'admin-1', actorType: ActorType.ADMIN });
    expect(event.location).toBe('Baghdad Sorting Hub');
    expect(event.actorId).toBe('admin-1');
    expect(event.actorType).toBe(ActorType.ADMIN);
  });

  it('is append-only — no mutator methods exist', () => {
    const event = buildEvent() as unknown as Record<string, unknown>;
    expect(event.update).toBeUndefined();
  });
});
