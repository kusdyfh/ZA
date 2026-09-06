import type { ActorRef } from '@za/types';
import type { Shipment } from '../entities/shipment.entity';
import type { ShipmentStatusValue } from '../constants/shipment-status.constants';

export const SHIPMENT_REPOSITORY = Symbol('SHIPMENT_REPOSITORY');

export interface CreateShipmentData {
  storeId: string;
  orderId: string;
  shippingMethodId: string | null;
}

export interface DispatchShipmentData {
  trackingNumber: string;
  carrierName: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
}

/**
 * `create` is called by `PlaceOrderUseCase`/`ConfirmCardPaymentUseCase`
 * (Checkout/Payments — both already depend on `ShippingModule` for rate
 * quoting) immediately after `Order` creation succeeds — deliberately
 * **not** wired into `PrismaOrderRepository.create()`'s own transaction
 * (ADR 0027's original design): `ShipmentRepository` already needs
 * `OrdersModule` (`AdvanceOrderStatusUseCase`, for `dispatch`/
 * `markDelivered`'s status-sync), so `OrdersModule` importing
 * `ShippingModule` back would be circular. The one-order-one-shipment
 * invariant is still enforced by `Shipment.orderId`'s `@unique` constraint;
 * the only change is which caller creates it and that it's a separate
 * (not nested) transaction.
 */
export interface ShipmentRepository {
  create(data: CreateShipmentData): Promise<Shipment>;
  findById(storeId: string, id: string): Promise<Shipment | null>;
  findByOrderId(storeId: string, orderId: string): Promise<Shipment | null>;
  dispatch(id: string, data: DispatchShipmentData, actor: ActorRef): Promise<Shipment>;
  markDelivered(id: string, actor: ActorRef): Promise<Shipment>;
  appendTrackingEvent(id: string, status: ShipmentStatusValue, note: string | null, actor: ActorRef): Promise<Shipment>;
  list(storeId: string): Promise<Shipment[]>;
}
