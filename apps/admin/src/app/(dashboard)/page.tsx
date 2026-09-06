'use client';

import Link from 'next/link';
import { AlertTriangle, ShoppingCart, Star, type LucideIcon } from 'lucide-react';
import { Badge, Callout, Card, DataTable, Skeleton, Text } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useOrderTotalQuery, usePendingOrderTotalQuery, useRecentOrdersQuery } from '@/features/dashboard/api';
import { useLowStockQuery } from '@/features/inventory/api';
import { usePendingReviewsQuery } from '@/features/reviews/api';
import type { Order, OrderStatus } from '@/features/orders/types';

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

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  isLoading: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <Text size="sm" muted>
              {label}
            </Text>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="font-display text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{value ?? '—'}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-pink-400 dark:text-pink-300" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const orderTotal = useOrderTotalQuery();
  const pendingOrderTotal = usePendingOrderTotalQuery();
  const lowStock = useLowStockQuery();
  const pendingReviews = usePendingReviewsQuery();
  const recentOrders = useRecentOrdersQuery();

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of the store — composed from existing list endpoints." />
      <Callout className="mb-6">
        There&apos;s no analytics/stats endpoint yet, so these numbers are each their own lightweight request, and
        there&apos;s no customer count at all (no customer list endpoint exists).
      </Callout>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Total orders" value={orderTotal.data?.meta.total} isLoading={orderTotal.isLoading} href="/orders" />
        <StatCard
          icon={ShoppingCart}
          label="Pending orders"
          value={pendingOrderTotal.data?.meta.total}
          isLoading={pendingOrderTotal.isLoading}
          href="/orders"
        />
        <StatCard icon={AlertTriangle} label="Low-stock items" value={lowStock.data?.length} isLoading={lowStock.isLoading} href="/inventory" />
        <StatCard icon={Star} label="Reviews awaiting moderation" value={pendingReviews.data?.length} isLoading={pendingReviews.isLoading} href="/reviews" />
      </div>

      <Text size="sm" className="mb-2 font-medium">
        Recent orders
      </Text>
      <DataTable
        columns={[
          {
            key: 'orderNumber',
            header: 'Order #',
            render: (row: Order) => (
              <Link href={`/orders/${row.id}`} className="font-medium text-pink-700 hover:underline dark:text-pink-300">
                {row.orderNumber}
              </Link>
            ),
          },
          { key: 'customerNameSnapshot', header: 'Customer', render: (row: Order) => row.customerNameSnapshot },
          {
            key: 'status',
            header: 'Status',
            render: (row: Order) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          { key: 'total', header: 'Total', align: 'right', render: (row: Order) => `${row.currencyCode} ${row.total}` },
          { key: 'createdAt', header: 'Placed', render: (row: Order) => new Date(row.createdAt).toLocaleString() },
        ]}
        rows={recentOrders.data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={recentOrders.isLoading}
        emptyTitle="No orders yet"
      />
    </div>
  );
}
