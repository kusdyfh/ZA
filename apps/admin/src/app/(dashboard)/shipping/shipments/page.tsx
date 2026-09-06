'use client';

import Link from 'next/link';
import { Badge, DataTable, ErrorState } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useShipmentsQuery } from '@/features/shipping/api';
import type { Shipment, ShipmentStatus } from '@/features/shipping/types';

const STATUS_TONE: Record<ShipmentStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  LABEL_CREATED: 'neutral',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'danger',
};

export default function ShipmentsPage() {
  const { data: shipments, isLoading, isError } = useShipmentsQuery();

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Shipments" description="One shipment per order, created automatically at checkout." />
      <DataTable
        columns={[
          {
            key: 'orderId',
            header: 'Order',
            render: (row: Shipment) => (
              <Link href={`/orders/${row.orderId}`} className="text-pink-600 hover:underline dark:text-pink-400">
                {row.orderId}
              </Link>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row: Shipment) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          { key: 'carrierName', header: 'Carrier', render: (row: Shipment) => row.carrierName ?? '—' },
          { key: 'trackingNumber', header: 'Tracking #', render: (row: Shipment) => row.trackingNumber ?? '—' },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Shipment) => (
              <Link href={`/shipping/shipments/${row.id}`} className="text-sm font-medium text-pink-600 hover:underline dark:text-pink-400">
                View
              </Link>
            ),
          },
        ]}
        rows={shipments ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No shipments yet"
        emptyDescription="Shipments are created automatically once an order is placed."
      />
    </div>
  );
}
