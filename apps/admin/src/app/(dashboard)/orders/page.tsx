'use client';

import { useRouter } from 'next/navigation';
import { Badge, DataTable, ErrorState, Input, Pagination, Select } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useTableState } from '@/lib/hooks/use-table-state';
import { useOrdersQuery } from '@/features/orders/api';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders/types';
import { useState } from 'react';

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

export default function OrdersPage() {
  const router = useRouter();
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } = useTableState();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { data, isLoading, isError } = useOrdersQuery({
    page,
    limit,
    search,
    sort: sortParam,
    status: status || undefined,
  });

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Orders" description="Every order placed in the store, guest or logged-in." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by order #, customer name, or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search orders"
          className="max-w-xs"
        />
        <Select
          aria-label="Filter by status"
          className="w-44"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | '')}
          placeholder="All statuses"
          options={ORDER_STATUSES.map((value) => ({ value, label: value }))}
        />
      </div>
      <DataTable
        columns={[
          {
            key: 'orderNumber',
            header: 'Order #',
            sortable: true,
            render: (row: Order) => (
              <button
                type="button"
                onClick={() => router.push(`/orders/${row.id}`)}
                className="font-medium text-pink-700 hover:underline dark:text-pink-300"
              >
                {row.orderNumber}
              </button>
            ),
          },
          { key: 'customerNameSnapshot', header: 'Customer', render: (row: Order) => row.customerNameSnapshot },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row: Order) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          {
            key: 'total',
            header: 'Total',
            sortable: true,
            align: 'right',
            render: (row: Order) => `${row.currencyCode} ${row.total}`,
          },
          {
            key: 'createdAt',
            header: 'Placed',
            sortable: true,
            render: (row: Order) => new Date(row.createdAt).toLocaleDateString(),
          },
        ]}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        sort={sort}
        onSortChange={toggleSort}
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
        emptyTitle="No orders yet"
        emptyDescription="Orders placed by guests or customers will show up here."
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}
    </div>
  );
}
