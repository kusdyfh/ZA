/** Per docs/v2/adr/0001's reservation lifecycle. */
export const STOCK_RESERVATION_STATUS = {
  ACTIVE: 'ACTIVE',
  CONFIRMED: 'CONFIRMED',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
} as const;

export type StockReservationStatusValue =
  (typeof STOCK_RESERVATION_STATUS)[keyof typeof STOCK_RESERVATION_STATUS];
