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
  type Tag,
  useTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from '@/features/tags/api';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

function TagForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<TagFormValues>;
  onSubmit: (values: TagFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TagFormValues>({ resolver: zodResolver(tagSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Name" errorText={errors.name?.message} {...register('name')} />
      <Input label="Slug" helperText="Leave blank to auto-generate" {...register('slug')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function TagsPage() {
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } =
    useTableState();
  const { data, isLoading, isError } = useTagsQuery({ page, limit, search, sort: sortParam });
  const createMutation = useCreateTagMutation();
  const updateMutation = useUpdateTagMutation();
  const deleteMutation = useDeleteTagMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  async function handleCreate(values: TagFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Tag created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create tag', description: describeError(error) });
    }
  }

  async function handleUpdate(values: TagFormValues) {
    if (!editingTag) return;
    try {
      await updateMutation.mutateAsync({ id: editingTag.id, values });
      showToast({ tone: 'success', title: 'Tag updated' });
      setEditingTag(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update tag', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingTag) return;
    try {
      await deleteMutation.mutateAsync(deletingTag.id);
      showToast({ tone: 'success', title: 'Tag deleted' });
      setDeletingTag(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete tag', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Freeform labels used to group and filter products."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add tag
          </Button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search tags"
        />
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true, render: (row: Tag) => row.name },
          { key: 'slug', header: 'Slug', render: (row: Tag) => row.slug },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Tag) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditingTag(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setDeletingTag(row)}
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
        emptyTitle="No tags yet"
        emptyDescription="Create your first tag to start labelling products."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add tag</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add tag">
        <TagForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingTag !== null} onClose={() => setEditingTag(null)} title="Edit tag">
        {editingTag && (
          <TagForm defaultValues={editingTag} onSubmit={handleUpdate} isSubmitting={updateMutation.isPending} />
        )}
      </Dialog>

      <Dialog
        open={deletingTag !== null}
        onClose={() => setDeletingTag(null)}
        title="Delete tag"
        description={`Are you sure you want to delete "${deletingTag?.name}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingTag(null)}>
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
