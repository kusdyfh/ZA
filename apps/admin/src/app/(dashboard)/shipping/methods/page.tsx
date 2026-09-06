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
  useCreateShippingMethodMutation,
  useShippingMethodsQuery,
  useUpdateShippingMethodMutation,
} from '@/features/shipping/api';
import type { ShippingMethod } from '@/features/shipping/types';

const methodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  minDays: z.coerce.number().int().min(0, 'Must be 0 or more'),
  maxDays: z.coerce.number().int().min(0, 'Must be 0 or more'),
  isActive: z.boolean().optional(),
});

type MethodFormValues = z.infer<typeof methodSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function MethodForm({
  defaultValues,
  showActiveToggle,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<MethodFormValues>;
  showActiveToggle?: boolean;
  onSubmit: (values: MethodFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MethodFormValues>({ resolver: zodResolver(methodSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Name" placeholder="Standard Delivery" errorText={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Min days" type="number" errorText={errors.minDays?.message} {...register('minDays')} />
        <Input label="Max days" type="number" errorText={errors.maxDays?.message} {...register('maxDays')} />
      </div>
      {showActiveToggle && (
        <Switch label="Active" checked={watch('isActive') ?? true} onChange={(checked) => setValue('isActive', checked)} />
      )}
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function ShippingMethodsPage() {
  const { data: methods, isLoading, isError } = useShippingMethodsQuery();
  const createMutation = useCreateShippingMethodMutation();
  const updateMutation = useUpdateShippingMethodMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

  async function handleCreate(values: MethodFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Method created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create method', description: describeError(error) });
    }
  }

  async function handleUpdate(values: MethodFormValues) {
    if (!editingMethod) return;
    try {
      await updateMutation.mutateAsync({ id: editingMethod.id, values });
      showToast({ tone: 'success', title: 'Method updated' });
      setEditingMethod(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update method', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Shipping methods"
        description="Delivery speed tiers (e.g. Standard, Express) customers choose from at checkout."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add method
          </Button>
        }
      />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (row: ShippingMethod) => row.name },
          {
            key: 'days',
            header: 'Estimated delivery',
            render: (row: ShippingMethod) => `${row.minDays}-${row.maxDays} business days`,
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (row: ShippingMethod) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: ShippingMethod) => (
              <button
                type="button"
                aria-label={`Edit ${row.name}`}
                onClick={() => setEditingMethod(row)}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ]}
        rows={methods ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No shipping methods yet"
        emptyDescription="Create a method to start quoting shipping rates."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add method</Button>}
      />

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add shipping method">
        <MethodForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingMethod !== null} onClose={() => setEditingMethod(null)} title="Edit shipping method">
        {editingMethod && (
          <MethodForm
            defaultValues={{
              name: editingMethod.name,
              minDays: editingMethod.minDays,
              maxDays: editingMethod.maxDays,
              isActive: editingMethod.isActive,
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
