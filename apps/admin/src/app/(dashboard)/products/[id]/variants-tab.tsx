'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, DataTable, Dialog, Input, Select, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import {
  type ProductVariant,
  useCreateVariantMutation,
  useDeleteVariantMutation,
  useProductVariantsQuery,
  useUpdateVariantMutation,
} from '@/features/products/variants-api';
import { useColorsQuery } from '@/features/colors/api';
import { useSizesQuery } from '@/features/sizes/api';

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  colorId: z.string().optional(),
  sizeId: z.string().optional(),
  priceOverride: z.coerce.number().min(0).optional(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function VariantForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<VariantFormValues>;
  onSubmit: (values: VariantFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { data: colors } = useColorsQuery({ limit: 100 });
  const { data: sizes } = useSizesQuery({ limit: 100 });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VariantFormValues>({ resolver: zodResolver(variantSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="SKU" errorText={errors.sku?.message} {...register('sku')} />
      <Input label="Barcode" {...register('barcode')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Color"
          placeholder="No color"
          options={(colors?.data ?? []).map((color) => ({ value: color.id, label: color.name }))}
          {...register('colorId')}
        />
        <Select
          label="Size"
          placeholder="No size"
          options={(sizes?.data ?? []).map((size) => ({ value: size.id, label: size.label }))}
          {...register('sizeId')}
        />
      </div>
      <Input label="Price override" type="number" step="0.01" helperText="Leave blank to use the product price" {...register('priceOverride')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

export function VariantsTab({ productId }: { productId: string }) {
  const { data: variants, isLoading } = useProductVariantsQuery(productId);
  const createMutation = useCreateVariantMutation(productId);
  const updateMutation = useUpdateVariantMutation(productId);
  const deleteMutation = useDeleteVariantMutation(productId);
  const { showToast } = useToast();

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      showToast({ tone: 'success', title: 'Variant ID copied', description: 'Paste it into Inventory → Stock to manage this variant’s stock.' });
    } catch {
      showToast({ tone: 'danger', title: 'Could not copy to clipboard' });
    }
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null);

  async function handleCreate(values: VariantFormValues) {
    try {
      await createMutation.mutateAsync({ productId, ...values });
      showToast({ tone: 'success', title: 'Variant created' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create variant', description: describeError(error) });
    }
  }

  async function handleUpdate(values: VariantFormValues) {
    if (!editingVariant) return;
    try {
      await updateMutation.mutateAsync({ id: editingVariant.id, values });
      showToast({ tone: 'success', title: 'Variant updated' });
      setEditingVariant(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update variant', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingVariant) return;
    try {
      await deleteMutation.mutateAsync(deletingVariant.id);
      showToast({ tone: 'success', title: 'Variant deleted' });
      setDeletingVariant(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete variant', description: describeError(error) });
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Add variant
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'sku', header: 'SKU', render: (row: ProductVariant) => row.sku },
          { key: 'barcode', header: 'Barcode', render: (row: ProductVariant) => row.barcode ?? '—' },
          {
            key: 'priceOverride',
            header: 'Price override',
            align: 'right',
            render: (row: ProductVariant) => row.priceOverride ?? '—',
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: ProductVariant) => (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label={`Copy ${row.sku}'s variant ID for Inventory`}
                  title="Copy variant ID (for Inventory → Stock)"
                  onClick={() => copyId(row.id)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${row.sku}`}
                  onClick={() => setEditingVariant(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.sku}`}
                  onClick={() => setDeletingVariant(row)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-500/10 hover:text-danger-500 dark:text-neutral-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ),
          },
        ]}
        rows={variants ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No variants yet"
        emptyDescription="Add a variant for each color/size combination this product is sold in."
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add variant</Button>}
      />

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add variant">
        <VariantForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingVariant !== null} onClose={() => setEditingVariant(null)} title="Edit variant">
        {editingVariant && (
          <VariantForm
            defaultValues={{
              sku: editingVariant.sku,
              barcode: editingVariant.barcode ?? undefined,
              colorId: editingVariant.colorId ?? undefined,
              sizeId: editingVariant.sizeId ?? undefined,
              priceOverride: editingVariant.priceOverride ? Number(editingVariant.priceOverride) : undefined,
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingVariant !== null}
        onClose={() => setDeletingVariant(null)}
        title="Delete variant"
        description={`Are you sure you want to delete "${deletingVariant?.sku}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingVariant(null)}>
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
