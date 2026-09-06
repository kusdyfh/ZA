'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, DataTable, Dialog, ErrorState, Input, Pagination, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useTableState } from '@/lib/hooks/use-table-state';
import { ApiError } from '@/lib/api/client';
import {
  type Size,
  useSizesQuery,
  useCreateSizeMutation,
  useDeleteSizeMutation,
  useUpdateSizeMutation,
} from '@/features/sizes/api';

const sizeSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  sortOrder: z.coerce.number().int().optional(),
});

type SizeFormValues = z.infer<typeof sizeSchema>;

function SizeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<SizeFormValues>;
  onSubmit: (values: SizeFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SizeFormValues>({ resolver: zodResolver(sizeSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Label" placeholder="e.g. M, L, XL" errorText={errors.label?.message} {...register('label')} />
      <Input label="Sort order" type="number" helperText="Lower numbers appear first" {...register('sortOrder')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function SizesPage() {
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } =
    useTableState();
  const { data, isLoading, isError } = useSizesQuery({ page, limit, search, sort: sortParam });
  const createMutation = useCreateSizeMutation();
  const updateMutation = useUpdateSizeMutation();
  const deleteMutation = useDeleteSizeMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [deletingSize, setDeletingSize] = useState<Size | null>(null);

  async function handleCreate(values: SizeFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Size created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create size', description: describeError(error) });
    }
  }

  async function handleUpdate(values: SizeFormValues) {
    if (!editingSize) return;
    try {
      await updateMutation.mutateAsync({ id: editingSize.id, values });
      showToast({ tone: 'success', title: 'Size updated' });
      setEditingSize(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update size', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingSize) return;
    try {
      await deleteMutation.mutateAsync(deletingSize.id);
      showToast({ tone: 'success', title: 'Size deleted' });
      setDeletingSize(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete size', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Sizes"
        description="The size options available when creating product variants."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add size
          </Button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search sizes..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search sizes"
        />
      </div>
      <DataTable
        columns={[
          { key: 'label', header: 'Label', sortable: true, render: (row: Size) => row.label },
          {
            key: 'sortOrder',
            header: 'Sort order',
            sortable: true,
            align: 'right',
            render: (row: Size) => row.sortOrder ?? '—',
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Size) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${row.label}`}
                  onClick={() => setEditingSize(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.label}`}
                  onClick={() => setDeletingSize(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-500/10 hover:text-danger-500 dark:text-neutral-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        sort={sort}
        onSortChange={toggleSort}
        emptyTitle="No sizes yet"
        emptyDescription="Create your first size to start building variants."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add size</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add size">
        <SizeForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingSize !== null} onClose={() => setEditingSize(null)} title="Edit size">
        {editingSize && (
          <SizeForm
            defaultValues={{ label: editingSize.label, sortOrder: editingSize.sortOrder ?? undefined }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingSize !== null}
        onClose={() => setDeletingSize(null)}
        title="Delete size"
        description={`Are you sure you want to delete "${deletingSize?.label}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingSize(null)}>
              Cancel
            </Button>
            <Button variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}
