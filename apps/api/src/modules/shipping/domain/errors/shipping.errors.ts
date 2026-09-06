import { DomainError } from '../../../../shared/errors/domain-error';

export class UnsupportedDeliveryRegionError extends DomainError {
  readonly code = 'UNSUPPORTED_DELIVERY_REGION';
  constructor(governorate: string) {
    super(`We don't currently deliver to "${governorate}". Please choose a different address.`);
  }
}

export class ShippingRateNotFoundError extends DomainError {
  readonly code = 'SHIPPING_RATE_NOT_FOUND';
  constructor() {
    super('No shipping rate is configured for this region and method.');
  }
}

export class ShippingZoneNotFoundError extends DomainError {
  readonly code = 'SHIPPING_ZONE_NOT_FOUND';
  constructor(id: string) {
    super(`Shipping zone "${id}" was not found.`);
  }
}

export class ShippingMethodNotFoundError extends DomainError {
  readonly code = 'SHIPPING_METHOD_NOT_FOUND';
  constructor(id: string) {
    super(`Shipping method "${id}" was not found.`);
  }
}

export class ShipmentNotFoundError extends DomainError {
  readonly code = 'SHIPMENT_NOT_FOUND';
  constructor(id: string) {
    super(`Shipment "${id}" was not found.`);
  }
}

export class IllegalShipmentStatusTransitionError extends DomainError {
  readonly code = 'ILLEGAL_SHIPMENT_STATUS_TRANSITION';
  constructor(from: string, to: string) {
    super(`Cannot move a shipment from "${from}" to "${to}".`);
  }
}

export class TrackingNumberRequiredError extends DomainError {
  readonly code = 'TRACKING_NUMBER_REQUIRED';
  constructor() {
    super('A tracking number is required to dispatch a shipment.');
  }
}
