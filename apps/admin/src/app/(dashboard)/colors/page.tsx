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
  type Color,
  useColorsQuery,
  useCreateColorMutation,
  useDeleteColorMutation,
  useUpdateColorMutation,
} from '@/features/colors/api';

const colorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hexCode: z
    .string()
    .min(1, 'Hex code is required')
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex code, e.g. #E8567F'),
});

type ColorFormValues = z.infer<typeof colorSchema>;

function ColorForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<ColorFormValues>;
  onSubmit: (values: ColorFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ColorFormValues>({ resolver: zodResolver(colorSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Name" errorText={errors.name?.message} {...register('name')} />
      <Input label="Hex code" placeholder="#E8567F" errorText={errors.hexCode?.message} {...register('hexCode')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function ColorsPage() {
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } =
    useTableState();
  const { data, isLoading, isError } = useColorsQuery({ page, limit, search, sort: sortParam });
  const createMutation = useCreateColorMutation();
  const updateMutation = useUpdateColorMutation();
  const deleteMutation = useDeleteColorMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [deletingColor, setDeletingColor] = useState<Color | null>(null);

  async function handleCreate(values: ColorFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Color created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create color', description: describeError(error) });
    }
  }

  async function handleUpdate(values: ColorFormValues) {
    if (!editingColor) return;
    try {
      await updateMutation.mutateAsync({ id: editingColor.id, values });
      showToast({ tone: 'success', title: 'Color updated' });
      setEditingColor(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update color', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingColor) return;
    try {
      await deleteMutation.mutateAsync(deletingColor.id);
      showToast({ tone: 'success', title: 'Color deleted' });
      setDeletingColor(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete color', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Colors"
        description="The color options available when creating product variants."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add color
          </Button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search colors..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search colors"
        />
      </div>
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (row: Color) => (
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: row.hexCode }}
                  aria-hidden="true"
                />
                {row.name}
              </div>
            ),
          },
          { key: 'hexCode', header: 'Hex code', render: (row: Color) => row.hexCode },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Color) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditingColor(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setDeletingColor(row)}
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
        emptyTitle="No colors yet"
        emptyDescription="Create your first color to start building variants."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add color</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add color">
        <ColorForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingColor !== null} onClose={() => setEditingColor(null)} title="Edit color">
        {editingColor && (
          <ColorForm defaultValues={editingColor} onSubmit={handleUpdate} isSubmitting={updateMutation.isPending} />
        )}
      </Dialog>

      <Dialog
        open={deletingColor !== null}
        onClose={() => setDeletingColor(null)}
        title="Delete color"
        description={`Are you sure you want to delete "${deletingColor?.name}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingColor(null)}>
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
