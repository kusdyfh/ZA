'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { Badge, Button, DataTable, Dialog, ErrorState, Input, Switch, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import {
  useCreateShippingZoneMutation,
  useShippingZonesQuery,
  useUpdateShippingZoneMutation,
} from '@/features/shipping/api';
import type { ShippingZone } from '@/features/shipping/types';

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  governorates: z.string().min(1, 'At least one governorate is required'),
  isActive: z.boolean().optional(),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

function toGovernoratesArray(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function ZoneForm({
  defaultValues,
  showActiveToggle,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<ZoneFormValues>;
  showActiveToggle?: boolean;
  onSubmit: (values: ZoneFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ZoneFormValues>({ resolver: zodResolver(zoneSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Name" errorText={errors.name?.message} {...register('name')} />
      <Input
        label="Governorates"
        placeholder="Baghdad, Basra, Erbil"
        helperText="Comma-separated list of governorates this zone delivers to."
        errorText={errors.governorates?.message}
        {...register('governorates')}
      />
      {showActiveToggle && (
        <Switch
          label="Active"
          checked={watch('isActive') ?? true}
          onChange={(checked) => setValue('isActive', checked)}
        />
      )}
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function ShippingZonesPage() {
  const { data: zones, isLoading, isError } = useShippingZonesQuery();
  const createMutation = useCreateShippingZoneMutation();
  const updateMutation = useUpdateShippingZoneMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

  async function handleCreate(values: ZoneFormValues) {
    try {
      await createMutation.mutateAsync({ name: values.name, governorates: toGovernoratesArray(values.governorates) });
      showToast({ tone: 'success', title: 'Zone created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create zone', description: describeError(error) });
    }
  }

  async function handleUpdate(values: ZoneFormValues) {
    if (!editingZone) return;
    try {
      await updateMutation.mutateAsync({
        id: editingZone.id,
        values: { name: values.name, governorates: toGovernoratesArray(values.governorates), isActive: values.isActive },
      });
      showToast({ tone: 'success', title: 'Zone updated' });
      setEditingZone(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update zone', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Shipping zones"
        description="Delivery regions grouped by governorate, used to resolve a shipping rate at checkout."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add zone
          </Button>
        }
      />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (row: ShippingZone) => row.name },
          {
            key: 'governorates',
            header: 'Governorates',
            render: (row: ShippingZone) => row.governorates.join(', '),
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (row: ShippingZone) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: ShippingZone) => (
              <button
                type="button"
                aria-label={`Edit ${row.name}`}
                onClick={() => setEditingZone(row)}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ]}
        rows={zones ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No shipping zones yet"
        emptyDescription="Create a zone to start quoting shipping rates."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add zone</Button>}
      />

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add shipping zone">
        <ZoneForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingZone !== null} onClose={() => setEditingZone(null)} title="Edit shipping zone">
        {editingZone && (
          <ZoneForm
            defaultValues={{
              name: editingZone.name,
              governorates: editingZone.governorates.join(', '),
              isActive: editingZone.isActive,
            }}
            showActiveToggle
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
}
