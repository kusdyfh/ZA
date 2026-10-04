'use client';

import { Badge, Card, CardContent, ErrorState, Heading, Spinner } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import {
  useCustomerOrderQuery,
  useCustomerOrdersQuery,
} from '@/features/orders/api';
import type { OrderStatus } from '@/features/orders/types';
import { useTrackShipmentQuery } from '@/features/shipping/api';
import type { ShipmentStatus } from '@/features/shipping/types';

const STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  PENDING: 'neutral',
  CONFIRMED: 'info',
  PREPARING: 'info',
  PACKED: 'info',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

const SHIPMENT_STATUS_TONE: Record<
  ShipmentStatus,
  'neutral' | 'warning' | 'success' | 'danger'
> = {
  PENDING: 'neutral',
  LABEL_CREATED: 'neutral',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'danger',
};

function OrderDetailContent({ orderId }: { orderId: string }) {
  const { isLoading: isListLoading } = useCustomerOrdersQuery();
  const { data: order } = useCustomerOrderQuery(orderId);
  const { data: shipment } = useTrackShipmentQuery(
    order?.orderNumber ?? '',
    order?.customerEmailSnapshot ?? '',
    Boolean(order),
  );

  if (isListLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <ErrorState
        title="Order not found"
        description="This order doesn't belong to your account, or the id is wrong."
      />
    );
  }

  // Internal staff notes are never meant for the customer — the API
  // returns the same `OrderResponseDto` shape it gives staff, so this
  // is a deliberate display filter, not new business logic (ADR 0022).
  const customerVisibleNotes = order.notes.filter((note) => !note.isInternal);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink dark:text-neutral-50"
          >
            Order #{order.orderNumber}
          </Heading>
          <p className="text-brand-mauve text-sm dark:text-neutral-400">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
      </div>

      <Card className="rounded-brand-lg border-brand-petal-100 bg-brand-paper shadow-brand-tight mb-6 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
        <CardContent className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-brand-ink dark:text-neutral-300">
                {item.productNameSnapshot} × {item.quantity}
              </span>
              <span className="text-brand-ink font-medium dark:text-neutral-50">
                {formatCurrency(item.lineTotal, {
                  currency: order.currencyCode,
                })}
              </span>
            </div>
          ))}
          <div className="border-brand-petal-100 text-brand-ink flex justify-between border-t pt-3 font-semibold dark:border-neutral-800 dark:text-neutral-50">
            <span>Total</span>
            <span>
              {formatCurrency(order.total, { currency: order.currencyCode })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-brand-ink font-display mb-3 text-lg font-semibold dark:text-neutral-50">
          Tracking
        </h2>
        <ol className="border-brand-petal-100 flex flex-col gap-4 border-s-2 ps-4 dark:border-neutral-800">
          {order.statusHistory.map((entry) => (
            <li key={entry.id}>
              <Badge tone={STATUS_TONE[entry.status]}>{entry.status}</Badge>
              <p className="text-brand-mauve mt-1 text-xs dark:text-neutral-400">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              {entry.note && (
                <p className="text-brand-ink mt-1 text-sm dark:text-neutral-300">
                  {entry.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {shipment && (
        <div className="mb-6">
          <h2 className="text-brand-ink font-display mb-3 text-lg font-semibold dark:text-neutral-50">
            Shipment
          </h2>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={SHIPMENT_STATUS_TONE[shipment.status]}>
              {shipment.status}
            </Badge>
            {shipment.carrierName && (
              <span className="text-brand-mauve text-sm dark:text-neutral-400">
                via {shipment.carrierName}
              </span>
            )}
          </div>
          {shipment.trackingNumber && (
            <p className="text-brand-ink mb-3 text-sm dark:text-neutral-300">
              Tracking number:{' '}
              {shipment.trackingUrl ? (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-plum hover:underline dark:text-pink-300"
                >
                  {shipment.trackingNumber}
                </a>
              ) : (
                shipment.trackingNumber
              )}
            </p>
          )}
          <ol className="border-brand-petal-100 flex flex-col gap-4 border-s-2 ps-4 dark:border-neutral-800">
            {shipment.trackingEvents.map((event) => (
              <li key={event.id}>
                <Badge tone={SHIPMENT_STATUS_TONE[event.status]}>
                  {event.status}
                </Badge>
                <p className="text-brand-mauve mt-1 text-xs dark:text-neutral-400">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
                {event.note && (
                  <p className="text-brand-ink mt-1 text-sm dark:text-neutral-300">
                    {event.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {customerVisibleNotes.length > 0 && (
        <div>
          <h2 className="text-brand-ink font-display mb-3 text-lg font-semibold dark:text-neutral-50">
            Notes
          </h2>
          <ul className="flex flex-col gap-3">
            {customerVisibleNotes.map((note) => (
              <li
                key={note.id}
                className="rounded-brand-sm bg-brand-blush text-brand-ink p-3 text-sm dark:bg-neutral-900 dark:text-neutral-300"
              >
                {note.body}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-brand-md border-brand-petal-100 text-brand-mauve mt-6 border p-4 text-sm dark:border-neutral-800 dark:text-neutral-400">
        <p className="text-brand-ink font-medium dark:text-neutral-50">
          Shipping to
        </p>
        <p>
          {order.shippingFullName}, {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ''},{' '}
          {order.shippingCity}, {order.shippingGovernorate},{' '}
          {order.shippingCountry}
        </p>
      </div>
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RequireCustomerAuth>
      {/* Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11). */}
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <OrderDetailContent orderId={params.id} />
        </div>
      </div>
    </RequireCustomerAuth>
  );
}
