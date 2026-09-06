import { STOCK_RESERVATION_STATUS, type StockReservationStatusValue } from '../constants/stock-reservation-status.constants';

export interface StockReservationProps {
  id: string;
  variantId: string;
  warehouseId: string;
  cartId: string;
  quantity: number;
  status: StockReservationStatusValue;
  expiresAt: Date;
  createdAt: Date;
  confirmedAt: Date | null;
  releasedAt: Date | null;
}

/**
 * A short-lived hold on stock — see docs/v2/adr/0001. Pure state
 * mutators only; the decision of *whether* a transition is currently
 * valid (idempotent no-op vs. genuine error) lives in `InventoryPolicy`,
 * and the atomicity with the actual stock decrement lives in
 * `StockReservationRepository` — this entity just applies whichever
 * transition it's told to.
 */
export class StockReservation {
  private constructor(private props: StockReservationProps) {}

  static reconstitute(props: StockReservationProps): StockReservation {
    return new StockReservation(props);
  }

  markConfirmed(confirmedAt: Date): void {
    this.props.status = STOCK_RESERVATION_STATUS.CONFIRMED;
    this.props.confirmedAt = confirmedAt;
  }

  markReleased(releasedAt: Date): void {
    this.props.status = STOCK_RESERVATION_STATUS.RELEASED;
    this.props.releasedAt = releasedAt;
  }

  markExpired(): void {
    this.props.status = STOCK_RESERVATION_STATUS.EXPIRED;
  }

  get id(): string {
    return this.props.id;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get warehouseId(): string {
    return this.props.warehouseId;
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get status(): StockReservationStatusValue {
    return this.props.status;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get confirmedAt(): Date | null {
    return this.props.confirmedAt;
  }

  get releasedAt(): Date | null {
    return this.props.releasedAt;
  }

  toProps(): StockReservationProps {
    return { ...this.props };
  }
}
