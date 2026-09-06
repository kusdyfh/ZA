'use client';

import { useState } from 'react';
import { Badge, Button, Callout, Card, DataTable, ForbiddenState, Input, Text } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useCustomerOrdersQuery, useCustomerQuery } from '@/features/customers/api';
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

export default function CustomersPage() {
  const [customerId, setCustomerId] = useState('');
  const [lookedUpId, setLookedUpId] = useState('');

  const customerQuery = useCustomerQuery(lookedUpId, Boolean(lookedUpId));
  const ordersQuery = useCustomerOrdersQuery(lookedUpId, Boolean(lookedUpId));

  const isForbidden = customerQuery.error instanceof ApiError && customerQuery.error.status === 403;

  return (
    <div>
      <PageHeader title="Customers" description="Look up a customer by ID to see their profile and order history." />
      <Callout className="mb-4">
        There&apos;s no &quot;list all customers&quot; endpoint yet — look one up by ID (found on an order&apos;s detail page, or
        share the id a customer gives support).
      </Callout>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="Customer ID" value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="max-w-md" />
        <Button onClick={() => setLookedUpId(customerId.trim())} disabled={!customerId.trim()}>
          Look up
        </Button>
      </div>

      {lookedUpId && isForbidden && <ForbiddenState />}

      {lookedUpId && !isForbidden && customerQuery.isError && (
        <Text className="text-danger-500">Customer not found.</Text>
      )}

      {lookedUpId && customerQuery.data && (
        <>
          <Card className="mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Text size="sm" muted>Name</Text>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {customerQuery.data.firstName} {customerQuery.data.lastName}
                </p>
              </div>
              <div>
                <Text size="sm" muted>Email</Text>
                <p className="text-neutral-900 dark:text-neutral-50">{customerQuery.data.email}</p>
              </div>
              <div>
                <Text size="sm" muted>Phone</Text>
                <p className="text-neutral-900 dark:text-neutral-50">{customerQuery.data.phone ?? '—'}</p>
              </div>
              <div>
                <Text size="sm" muted>Marketing opt-in</Text>
                <Badge tone={customerQuery.data.marketingOptIn ? 'success' : 'neutral'}>
                  {customerQuery.data.marketingOptIn ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </Card>

          <Text size="sm" className="mb-2 font-medium">
            Order history
          </Text>
          <DataTable
            columns={[
              { key: 'orderNumber', header: 'Order #', render: (row: Order) => row.orderNumber },
              {
                key: 'status',
                header: 'Status',
                render: (row: Order) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
              },
              { key: 'total', header: 'Total', align: 'right', render: (row: Order) => `${row.currencyCode} ${row.total}` },
              { key: 'createdAt', header: 'Placed', render: (row: Order) => new Date(row.createdAt).toLocaleDateString() },
            ]}
            rows={ordersQuery.data ?? []}
            rowKey={(row) => row.id}
            isLoading={ordersQuery.isLoading}
            emptyTitle="No orders yet"
          />
        </>
      )}
    </div>
  );
}
