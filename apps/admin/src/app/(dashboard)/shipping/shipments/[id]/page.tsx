'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card, DataTable, Dialog, ErrorState, Input, Spinner, Text, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useDispatchShipmentMutation, useMarkShipmentDeliveredMutation, useShipmentQuery } from '@/features/shipping/api';
import type { ShipmentStatus, ShipmentTrackingEvent } from '@/features/shipping/types';

const STATUS_TONE: Record<ShipmentStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  LABEL_CREATED: 'neutral',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'danger',
};

const dispatchSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrierName: z.string().optional(),
});

type DispatchFormValues = z.infer<typeof dispatchSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;
  const { data: shipment, isLoading, isError } = useShipmentQuery(shipmentId);
  const dispatchMutation = useDispatchShipmentMutation();
  const deliverMutation = useMarkShipmentDeliveredMutation();
  const { showToast } = useToast();

  const [isDispatchOpen, setIsDispatchOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DispatchFormValues>({ resolver: zodResolver(dispatchSchema) });

  const onDispatch = handleSubmit(async (values) => {
    try {
      await dispatchMutation.mutateAsync({ id: shipmentId, ...values });
      showToast({ tone: 'success', title: 'Shipment dispatched' });
      setIsDispatchOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not dispatch shipment', description: describeError(error) });
    }
  });

  async function handleMarkDelivered() {
    try {
      await deliverMutation.mutateAsync(shipmentId);
      showToast({ tone: 'success', title: 'Shipment marked as delivered' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not mark delivered', description: describeError(error) });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError || !shipment) {
    return <ErrorState title="Shipment not found" />;
  }

  const canDispatch = shipment.status === 'PENDING';
  const canMarkDelivered = shipment.status === 'IN_TRANSIT';

  return (
    <div>
      <PageHeader
        title={`Shipment for order ${shipment.orderId}`}
        action={
          <div className="flex gap-2">
            {canDispatch && <Button onClick={() => setIsDispatchOpen(true)}>Dispatch</Button>}
            {canMarkDelivered && (
              <Button isLoading={deliverMutation.isPending} onClick={handleMarkDelivered}>
                Mark delivered
              </Button>
            )}
          </div>
        }
      />
      <Link href={`/orders/${shipment.orderId}`} className="mb-4 inline-block text-sm text-pink-600 hover:underline dark:text-pink-400">
        View order →
      </Link>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <Text size="sm" muted>
            Status
          </Text>
          <div className="mt-1">
            <Badge tone={STATUS_TONE[shipment.status]}>{shipment.status}</Badge>
          </div>
        </Card>
        <Card>
          <Text size="sm" muted>
            Carrier
          </Text>
          <p className="text-neutral-900 dark:text-neutral-50">{shipment.carrierName ?? '—'}</p>
        </Card>
        <Card>
          <Text size="sm" muted>
            Tracking number
          </Text>
          <p className="text-neutral-900 dark:text-neutral-50">
            {shipment.trackingUrl && shipment.trackingNumber ? (
              <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline dark:text-pink-400">
                {shipment.trackingNumber}
              </a>
            ) : (
              (shipment.trackingNumber ?? '—')
            )}
          </p>
        </Card>
      </div>

      <Text size="sm" className="mb-2 font-medium">
        Tracking timeline
      </Text>
      <DataTable
        columns={[
          {
            key: 'status',
            header: 'Status',
            render: (row: ShipmentTrackingEvent) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          { key: 'note', header: 'Note', render: (row: ShipmentTrackingEvent) => row.note ?? '—' },
          { key: 'location', header: 'Location', render: (row: ShipmentTrackingEvent) => row.location ?? '—' },
          { key: 'createdAt', header: 'When', render: (row: ShipmentTrackingEvent) => new Date(row.createdAt).toLocaleString() },
        ]}
        rows={shipment.trackingEvents}
        rowKey={(row) => row.id}
        emptyTitle="No tracking events yet"
      />

      <Dialog open={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} title="Dispatch shipment">
        <form className="flex flex-col gap-4" onSubmit={onDispatch} noValidate>
          <Input label="Tracking number" errorText={errors.trackingNumber?.message} {...register('trackingNumber')} />
          <Input label="Carrier (optional)" {...register('carrierName')} />
          <Button type="submit" isLoading={dispatchMutation.isPending} className="self-end">
            Dispatch
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
