import { DomainError } from '../../../../shared/errors/domain-error';

export class InvalidNameError extends DomainError {
  readonly code = 'INVALID_NAME';
  constructor(entity: string) {
    super(`${entity} name must not be empty.`);
  }
}

export class WarehouseCodeAlreadyInUseError extends DomainError {
  readonly code = 'WAREHOUSE_CODE_ALREADY_IN_USE';
  constructor(code: string) {
    super(`The warehouse code "${code}" is already in use.`);
  }
}

export class WarehouseNotFoundError extends DomainError {
  readonly code = 'WAREHOUSE_NOT_FOUND';
  constructor(id: string) {
    super(`Warehouse "${id}" was not found.`);
  }
}

export class ProductVariantNotFoundError extends DomainError {
  readonly code = 'PRODUCT_VARIANT_NOT_FOUND';
  constructor(id: string) {
    super(`Product variant "${id}" was not found.`);
  }
}

export class VariantStockNotFoundError extends DomainError {
  readonly code = 'VARIANT_STOCK_NOT_FOUND';
  constructor(variantId: string, warehouseId: string) {
    super(`No stock record for variant "${variantId}" at warehouse "${warehouseId}".`);
  }
}

export class StockReservationNotFoundError extends DomainError {
  readonly code = 'STOCK_RESERVATION_NOT_FOUND';
  constructor(id: string) {
    super(`Stock reservation "${id}" was not found.`);
  }
}

export class InvalidQuantityError extends DomainError {
  readonly code = 'INVALID_QUANTITY';
  constructor(message = 'Quantity must be greater than zero.') {
    super(message);
  }
}

export class InvalidAdjustmentQuantityError extends DomainError {
  readonly code = 'INVALID_ADJUSTMENT_QUANTITY';
  constructor() {
    super('Adjustment quantity cannot be zero.');
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  constructor(available: number, requested: number) {
    super(`Only ${available} unit(s) available, but ${requested} were requested.`);
  }
}

export class NegativeStockError extends DomainError {
  readonly code = 'NEGATIVE_STOCK';
  constructor() {
    super('This change would bring stock below zero.');
  }
}

export class ReservationNotConfirmableError extends DomainError {
  readonly code = 'RESERVATION_NOT_CONFIRMABLE';
  constructor(status: string) {
    super(`Cannot confirm a reservation in "${status}" status.`);
  }
}

export class ReservationNotReleasableError extends DomainError {
  readonly code = 'RESERVATION_NOT_RELEASABLE';
  constructor(status: string) {
    super(`Cannot release a reservation in "${status}" status.`);
  }
}
