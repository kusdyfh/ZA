import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Shipment } from '../../domain/entities/shipment.entity';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShippingPolicy } from '../../domain/policies/shipping-policy';
import { ShipmentNotFoundError } from '../../domain/errors/shipping.errors';
import { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import { AdvanceOrderStatusUseCase } from '../../../orders/application/use-cases/advance-order-status.use-case';
import { ORDER_STATUS, type OrderStatusValue } from '../../../orders/domain/constants/order-status.constants';
import { SHIPPING_PROVIDER, type ShippingProviderPort } from '../../domain/ports/shipping-provider.port';

export interface DispatchShipmentInput {
  shipmentId: string;
  trackingNumber: string;
  carrierName?: string | null;
  actor: ActorRef;
}

/**
 * The normal fulfillment path (`AdvanceOrderStatusUseCase`'s own doc
 * comment) requires each hop one at a time — Confirmed → Preparing →
 * Packed → Shipped — so a fresh order (still `CONFIRMED`, the state
 * every order is in immediately after checkout) cannot jump straight to
 * `SHIPPED`. Dispatch is meant to be the one staff action that completes
 * the rest of the fulfillment path in one click, so it walks through
 * every remaining intermediate status before `SHIPPED` rather than
 * assuming the order is already `PACKED`.
 */
const ORDER_FULFILLMENT_PATH: readonly OrderStatusValue[] = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
];

/**
 * "Shipping Labels" + "Order status synchronization" in one call (ADR
 * 0027) — creates a placeholder label (no real carrier API exists to
 * call), appends a tracking event, and moves the shipment straight to
 * `IN_TRANSIT` (no separate "label printed, not yet handed to carrier"
 * state — matches the product's flat, simple v1 scope), **and** advances
 * the linked `Order` to `SHIPPED` via the existing, unmodified
 * `AdvanceOrderStatusUseCase` — one staff action moves both together.
 * The order sync runs *before* the shipment is mutated: `Shipment.dispatch()`
 * commits its own transaction independently, so if the order-status walk
 * fails partway (an unexpected state), the shipment is never left
 * `IN_TRANSIT` while its order is stuck behind it.
 */
@Injectable()
export class DispatchShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    @Inject(SHIPPING_PROVIDER) private readonly shippingProvider: ShippingProviderPort,
    private readonly getOrder: GetOrderUseCase,
    private readonly advanceOrderStatus: AdvanceOrderStatusUseCase,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: DispatchShipmentInput): Promise<Shipment> {
    ShippingPolicy.assertTrackingNumberProvided(input.trackingNumber);

    const storeId = await this.storeContext.getCurrentStoreId();
    const existing = await this.shipments.findById(storeId, input.shipmentId);
    if (!existing) {
      throw new ShipmentNotFoundError(input.shipmentId);
    }

    await this.advanceOrderToShipped(existing.orderId, input.actor);

    const label = await this.shippingProvider.createLabel({
      trackingNumber: input.trackingNumber,
      carrierName: input.carrierName ?? null,
    });

    return this.shipments.dispatch(
      input.shipmentId,
      {
        trackingNumber: input.trackingNumber,
        carrierName: input.carrierName ?? null,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
      },
      input.actor,
    );
  }

  private async advanceOrderToShipped(orderId: string, actor: ActorRef): Promise<void> {
    const order = await this.getOrder.execute({ orderId });
    const currentIndex = ORDER_FULFILLMENT_PATH.indexOf(order.status);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;

    for (let i = startIndex + 1; i < ORDER_FULFILLMENT_PATH.length; i += 1) {
      await this.advanceOrderStatus.execute({ orderId, status: ORDER_FULFILLMENT_PATH[i]!, actor });
    }
  }
}
