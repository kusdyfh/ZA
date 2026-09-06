'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  DataTable,
  Dialog,
  ErrorState,
  Input,
  Pagination,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useTableState } from '@/lib/hooks/use-table-state';
import { ApiError } from '@/lib/api/client';
import {
  type Category,
  useAllCategoriesQuery,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useSetCategoryActiveMutation,
  useUpdateCategoryMutation,
} from '@/features/categories/api';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  parentId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function CategoryForm({
  defaultValues,
  excludeId,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<CategoryFormValues>;
  excludeId?: string;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { data: allCategories } = useAllCategoriesQuery();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues });

  const parentOptions = (allCategories?.data ?? [])
    .filter((category) => category.id !== excludeId)
    .map((category) => ({ value: category.id, label: category.name }));

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Name" errorText={errors.name?.message} {...register('name')} />
      <Input label="Slug" helperText="Leave blank to auto-generate" {...register('slug')} />
      <Textarea label="Description" {...register('description')} />
      <Select
        label="Parent category"
        placeholder="No parent (top-level)"
        options={parentOptions}
        {...register('parentId')}
      />
      <Input label="Sort order" type="number" {...register('sortOrder')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export default function CategoriesPage() {
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } =
    useTableState();
  const { data, isLoading, isError } = useCategoriesQuery({ page, limit, search, sort: sortParam });
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const setActiveMutation = useSetCategoryActiveMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  async function handleCreate(values: CategoryFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Category created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create category', description: describeError(error) });
    }
  }

  async function handleUpdate(values: CategoryFormValues) {
    if (!editingCategory) return;
    try {
      await updateMutation.mutateAsync({ id: editingCategory.id, values });
      showToast({ tone: 'success', title: 'Category updated' });
      setEditingCategory(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update category', description: describeError(error) });
    }
  }

  async function handleToggleActive(category: Category) {
    try {
      await setActiveMutation.mutateAsync({ id: category.id, isActive: !category.isActive });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not change status', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      showToast({ tone: 'success', title: 'Category deleted' });
      setDeletingCategory(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete category', description: describeError(error) });
    }
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The hierarchy products are organized under."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add category
          </Button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search categories"
        />
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true, render: (row: Category) => row.name },
          { key: 'slug', header: 'Slug', render: (row: Category) => row.slug },
          {
            key: 'sortOrder',
            header: 'Sort order',
            sortable: true,
            align: 'right',
            render: (row: Category) => row.sortOrder ?? '—',
          },
          {
            key: 'isActive',
            header: 'Active',
            render: (row: Category) => (
              <Switch checked={row.isActive} onChange={() => handleToggleActive(row)} label={row.isActive ? 'Active' : 'Inactive'} />
            ),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Category) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditingCategory(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setDeletingCategory(row)}
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
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to start organizing products."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add category</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add category" size="lg">
        <CategoryForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingCategory !== null} onClose={() => setEditingCategory(null)} title="Edit category" size="lg">
        {editingCategory && (
          <CategoryForm
            excludeId={editingCategory.id}
            defaultValues={{
              name: editingCategory.name,
              slug: editingCategory.slug,
              description: editingCategory.description ?? undefined,
              sortOrder: editingCategory.sortOrder ?? undefined,
              parentId: editingCategory.parentId ?? undefined,
              metaTitle: editingCategory.metaTitle ?? undefined,
              metaDescription: editingCategory.metaDescription ?? undefined,
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        title="Delete category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
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
