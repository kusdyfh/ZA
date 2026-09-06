'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Plus } from 'lucide-react';
import { Badge, Button, Checkbox, DataTable, Dialog, ErrorState, Input, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { type Warehouse, useCreateWarehouseMutation, useUpdateWarehouseMutation, useWarehousesQuery } from '@/features/inventory/api';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  isDefault: z.boolean().optional(),
});
const updateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
});

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export function WarehousesTab() {
  const { data: warehouses, isLoading, isError } = useWarehousesQuery();
  const createMutation = useCreateWarehouseMutation();
  const updateMutation = useUpdateWarehouseMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const createForm = useForm<z.infer<typeof createSchema>>({ resolver: zodResolver(createSchema) });
  const updateForm = useForm<z.infer<typeof updateSchema>>({ resolver: zodResolver(updateSchema) });

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Warehouse created' });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create warehouse', description: describeError(error) });
    }
  });

  const onUpdate = updateForm.handleSubmit(async (values) => {
    if (!editingWarehouse) return;
    try {
      await updateMutation.mutateAsync({ id: editingWarehouse.id, values });
      showToast({ tone: 'success', title: 'Warehouse updated' });
      setEditingWarehouse(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update warehouse', description: describeError(error) });
    }
  });

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Add warehouse
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (row: Warehouse) => row.name },
          { key: 'code', header: 'Code', render: (row: Warehouse) => row.code },
          {
            key: 'isDefault',
            header: 'Default',
            render: (row: Warehouse) => (row.isDefault ? <Badge tone="success">Default</Badge> : null),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Warehouse) => (
              <button
                type="button"
                aria-label={`Edit ${row.name}`}
                onClick={() => {
                  setEditingWarehouse(row);
                  updateForm.reset({ name: row.name, code: row.code });
                }}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ]}
        rows={warehouses ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No warehouses yet"
        emptyDescription="Add your first warehouse to start tracking stock."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add warehouse</Button>}
      />

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add warehouse">
        <form className="flex flex-col gap-4" onSubmit={onCreate} noValidate>
          <Input label="Name" errorText={createForm.formState.errors.name?.message} {...createForm.register('name')} />
          <Input label="Code" errorText={createForm.formState.errors.code?.message} {...createForm.register('code')} />
          <Checkbox label="Set as default warehouse" {...createForm.register('isDefault')} />
          <Button type="submit" isLoading={createMutation.isPending} className="self-end">
            Save
          </Button>
        </form>
      </Dialog>

      <Dialog open={editingWarehouse !== null} onClose={() => setEditingWarehouse(null)} title="Edit warehouse">
        <form className="flex flex-col gap-4" onSubmit={onUpdate} noValidate>
          <Input label="Name" errorText={updateForm.formState.errors.name?.message} {...updateForm.register('name')} />
          <Input label="Code" errorText={updateForm.formState.errors.code?.message} {...updateForm.register('code')} />
          <Button type="submit" isLoading={updateMutation.isPending} className="self-end">
            Save
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
