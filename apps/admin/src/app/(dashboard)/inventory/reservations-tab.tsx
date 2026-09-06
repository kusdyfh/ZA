'use client';

import { useState } from 'react';
import { Badge, Button, Callout, Card, Input, Text, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import {
  useConfirmReservationMutation,
  useExpireDueReservationsMutation,
  useReleaseReservationMutation,
  useStockReservationQuery,
} from '@/features/inventory/api';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'danger' | 'info'> = {
  PENDING: 'info',
  CONFIRMED: 'success',
  RELEASED: 'neutral',
  EXPIRED: 'danger',
};

export function ReservationsTab() {
  const [reservationId, setReservationId] = useState('');
  const [lookedUpId, setLookedUpId] = useState('');
  const { showToast } = useToast();

  const reservationQuery = useStockReservationQuery(lookedUpId, Boolean(lookedUpId));
  const confirmMutation = useConfirmReservationMutation();
  const releaseMutation = useReleaseReservationMutation();
  const expireDueMutation = useExpireDueReservationsMutation();

  async function handleConfirm() {
    try {
      await confirmMutation.mutateAsync(lookedUpId);
      showToast({ tone: 'success', title: 'Reservation confirmed' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not confirm reservation', description: describeError(error) });
    }
  }

  async function handleRelease() {
    try {
      await releaseMutation.mutateAsync(lookedUpId);
      showToast({ tone: 'success', title: 'Reservation released' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not release reservation', description: describeError(error) });
    }
  }

  async function handleExpireDue() {
    try {
      const result = await expireDueMutation.mutateAsync();
      showToast({ tone: 'success', title: `Expired ${result.expiredCount} due reservation(s)` });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not expire reservations', description: describeError(error) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Callout>There&apos;s no &quot;list all reservations&quot; endpoint — look one up by ID (found on its Order&apos;s items).</Callout>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Reservation ID"
          value={reservationId}
          onChange={(event) => setReservationId(event.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setLookedUpId(reservationId.trim())} disabled={!reservationId.trim()}>
          Look up
        </Button>
        <Button variant="outline" isLoading={expireDueMutation.isPending} onClick={handleExpireDue}>
          Expire all due reservations
        </Button>
      </div>

      {lookedUpId && reservationQuery.isError && <Text className="text-danger-500">Reservation not found.</Text>}

      {lookedUpId && reservationQuery.data && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
              <div>
                <Text size="sm" muted>
                  Status
                </Text>
                <Badge tone={STATUS_TONE[reservationQuery.data.status] ?? 'neutral'}>{reservationQuery.data.status}</Badge>
              </div>
              <div>
                <Text size="sm" muted>
                  Quantity
                </Text>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">{reservationQuery.data.quantity}</p>
              </div>
              <div>
                <Text size="sm" muted>
                  Expires at
                </Text>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {new Date(reservationQuery.data.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Text size="sm" muted>
                  Cart ID
                </Text>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{reservationQuery.data.cartId}</p>
              </div>
            </div>
            {reservationQuery.data.status === 'PENDING' && (
              <div className="flex gap-2">
                <Button size="sm" isLoading={confirmMutation.isPending} onClick={handleConfirm}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" isLoading={releaseMutation.isPending} onClick={handleRelease}>
                  Release
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
