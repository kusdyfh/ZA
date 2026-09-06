'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card, CardContent, ErrorState, Heading, Input, Spinner, Text } from '@za/ui';
import { useTrackShipmentQuery } from '@/features/shipping/api';
import type { ShipmentStatus } from '@/features/shipping/types';

const STATUS_TONE: Record<ShipmentStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  LABEL_CREATED: 'neutral',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'danger',
};

const trackSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type TrackFormValues = z.infer<typeof trackSchema>;

export default function TrackOrderPage() {
  const [submitted, setSubmitted] = useState<TrackFormValues | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackFormValues>({ resolver: zodResolver(trackSchema) });

  const { data: shipment, isFetching, isError } = useTrackShipmentQuery(
    submitted?.orderNumber ?? '',
    submitted?.email ?? '',
    submitted !== null,
  );

  const onSubmit = handleSubmit((values) => setSubmitted(values));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Heading level={2} as="h1" className="mb-2">
        Track your order
      </Heading>
      <Text muted className="mb-8">
        Enter your order number and the email you used at checkout to see its shipping status.
      </Text>

      <Card className="mb-8">
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <Input label="Order number" placeholder="ORD-20260805-ABCD1234" errorText={errors.orderNumber?.message} {...register('orderNumber')} />
            <Input label="Email" type="email" errorText={errors.email?.message} {...register('email')} />
            <Button type="submit" isLoading={isFetching} className="self-start">
              Track order
            </Button>
          </form>
        </CardContent>
      </Card>

      {isFetching && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {submitted && !isFetching && isError && (
        <ErrorState
          title="We couldn't find that order"
          description="Double-check the order number and email, then try again."
        />
      )}

      {shipment && !isFetching && (
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <Text className="font-medium">Shipment status</Text>
              <Badge tone={STATUS_TONE[shipment.status]}>{shipment.status}</Badge>
            </div>
            {shipment.carrierName && (
              <Text size="sm" muted className="mb-1">
                Carrier: {shipment.carrierName}
              </Text>
            )}
            {shipment.trackingNumber && (
              <Text size="sm" muted className="mb-4">
                Tracking number:{' '}
                {shipment.trackingUrl ? (
                  <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline dark:text-pink-400">
                    {shipment.trackingNumber}
                  </a>
                ) : (
                  shipment.trackingNumber
                )}
              </Text>
            )}
            <ol className="flex flex-col gap-4 border-s-2 border-neutral-200 ps-4 dark:border-neutral-800">
              {shipment.trackingEvents.map((event) => (
                <li key={event.id}>
                  <Badge tone={STATUS_TONE[event.status]}>{event.status}</Badge>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                  {event.note && <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{event.note}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
