'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { Button, DataTable, Dialog, ErrorState, Input, Select, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useShippingMethodsQuery, useShippingZonesQuery, useSetShippingRateMutation, useShippingRatesQuery } from '@/features/shipping/api';
import type { ShippingRate } from '@/features/shipping/types';

const rateSchema = z.object({
  zoneId: z.string().min(1, 'A zone is required'),
  methodId: z.string().min(1, 'A method is required'),
  fee: z.coerce.number().min(0, 'Must be 0 or more'),
  freeShippingThreshold: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
});

type RateFormValues = z.infer<typeof rateSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export default function ShippingRatesPage() {
  const { data: rates, isLoading, isError } = useShippingRatesQuery();
  const { data: zones } = useShippingZonesQuery();
  const { data: methods } = useShippingMethodsQuery();
  const setRateMutation = useSetShippingRateMutation();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

  const zoneNameById = useMemo(() => new Map((zones ?? []).map((zone) => [zone.id, zone.name])), [zones]);
  const methodNameById = useMemo(() => new Map((methods ?? []).map((method) => [method.id, method.name])), [methods]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RateFormValues>({ resolver: zodResolver(rateSchema) });

  function openCreate() {
    setEditingRate(null);
    reset({ zoneId: '', methodId: '', fee: 0, freeShippingThreshold: undefined });
    setIsFormOpen(true);
  }

  function openEdit(rate: ShippingRate) {
    setEditingRate(rate);
    reset({
      zoneId: rate.zoneId,
      methodId: rate.methodId,
      fee: rate.fee,
      freeShippingThreshold: rate.freeShippingThreshold ?? undefined,
    });
    setIsFormOpen(true);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await setRateMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Rate saved' });
      setIsFormOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not save rate', description: describeError(error) });
    }
  });

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Shipping rates"
        description="The fee charged for each (zone, method) pair — one rate per combination."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Set rate
          </Button>
        }
      />
      <DataTable
        columns={[
          { key: 'zone', header: 'Zone', render: (row: ShippingRate) => zoneNameById.get(row.zoneId) ?? row.zoneId },
          { key: 'method', header: 'Method', render: (row: ShippingRate) => methodNameById.get(row.methodId) ?? row.methodId },
          { key: 'fee', header: 'Fee', align: 'right', render: (row: ShippingRate) => row.fee },
          {
            key: 'freeShippingThreshold',
            header: 'Free shipping over',
            align: 'right',
            render: (row: ShippingRate) => (row.freeShippingThreshold != null ? row.freeShippingThreshold : '—'),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: ShippingRate) => (
              <button
                type="button"
                aria-label="Edit rate"
                onClick={() => openEdit(row)}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ]}
        rows={rates ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No shipping rates yet"
        emptyDescription="Set a rate for a zone and method combination."
        emptyAction={<Button onClick={openCreate}>Set rate</Button>}
      />

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRate ? 'Edit shipping rate' : 'Set shipping rate'}>
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Select
            label="Zone"
            placeholder="Choose a zone"
            options={(zones ?? []).map((zone) => ({ value: zone.id, label: zone.name }))}
            errorText={errors.zoneId?.message}
            {...register('zoneId')}
          />
          <Select
            label="Method"
            placeholder="Choose a method"
            options={(methods ?? []).map((method) => ({ value: method.id, label: method.name }))}
            errorText={errors.methodId?.message}
            {...register('methodId')}
          />
          <Input label="Fee" type="number" errorText={errors.fee?.message} {...register('fee')} />
          <Input
            label="Free shipping threshold (optional)"
            type="number"
            helperText="Orders at or above this subtotal ship free."
            errorText={errors.freeShippingThreshold?.message}
            {...register('freeShippingThreshold')}
          />
          <Button type="submit" isLoading={setRateMutation.isPending} className="self-end">
            Save
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
