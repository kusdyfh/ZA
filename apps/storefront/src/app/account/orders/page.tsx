'use client';

import Link from 'next/link';
import { Badge, EmptyState, Heading, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import { useCustomerOrdersQuery } from '@/features/orders/api';
import type { OrderStatus } from '@/features/orders/types';

const STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  CONFIRMED: 'info',
  PREPARING: 'info',
  PACKED: 'info',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

function OrderHistoryContent() {
  const { data: orders, isLoading } = useCustomerOrdersQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders placed while signed in — or linked to your account at your next sign-in after a guest purchase — will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 hover:shadow-md dark:border-neutral-800"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-50">Order #{order.orderNumber}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              <span className="font-medium text-neutral-900 dark:text-neutral-50">
                {formatCurrency(order.total, { currency: order.currencyCode })}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrderHistoryPage() {
  return (
    <RequireCustomerAuth>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Heading level={2} as="h1" className="mb-6">
          Order history
        </Heading>
        <OrderHistoryContent />
      </div>
    </RequireCustomerAuth>
  );
}
