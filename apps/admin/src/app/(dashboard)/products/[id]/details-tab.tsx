'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Select, Textarea, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useChangeProductStatusMutation, useUpdateProductMutation } from '@/features/products/api';
import { PRODUCT_STATUSES, type Product, type ProductStatus } from '@/features/products/types';
import { useAllCategoriesQuery } from '@/features/categories/api';
import { useBrandsQuery } from '@/features/brands/api';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isGiftBox: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const STATUS_TONE: Record<ProductStatus, 'neutral' | 'success'> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export function DetailsTab({ product }: { product: Product }) {
  const { showToast } = useToast();
  const updateMutation = useUpdateProductMutation();
  const statusMutation = useChangeProductStatusMutation();
  const { data: categories } = useAllCategoriesQuery();
  const { data: brands } = useBrandsQuery({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription ?? undefined,
      description: product.description ?? undefined,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      categoryId: product.categoryId,
      brandId: product.brandId ?? undefined,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      isGiftBox: product.isGiftBox,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: product.id, values });
      showToast({ tone: 'success', title: 'Product updated' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update product', description: describeError(error) });
    }
  });

  async function handleStatusChange(status: ProductStatus) {
    try {
      await statusMutation.mutateAsync({ id: product.id, status });
      showToast({ tone: 'success', title: `Status changed to ${status}` });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not change status', description: describeError(error) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Status</CardTitle>
          <Badge tone={STATUS_TONE[product.status]}>{product.status}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRODUCT_STATUSES.map((status) => (
            <Button
              key={status}
              variant={status === product.status ? 'primary' : 'outline'}
              size="sm"
              isLoading={statusMutation.isPending}
              disabled={status === product.status}
              onClick={() => handleStatusChange(status)}
            >
              {status}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" errorText={errors.name?.message} {...register('name')} />
              <Input label="SKU" errorText={errors.sku?.message} {...register('sku')} />
            </div>
            <Input label="Slug" {...register('slug')} />
            <Textarea label="Short description" {...register('shortDescription')} />
            <Textarea label="Description" rows={6} {...register('description')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Price" type="number" step="0.01" errorText={errors.price?.message} {...register('price')} />
              <Input label="Discount price" type="number" step="0.01" {...register('discountPrice')} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                options={(categories?.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
                errorText={errors.categoryId?.message}
                {...register('categoryId')}
              />
              <Select
                label="Brand"
                placeholder="No brand"
                options={(brands?.data ?? []).map((brand) => ({ value: brand.id, label: brand.name }))}
                {...register('brandId')}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Checkbox label="Featured" {...register('isFeatured')} />
              <Checkbox label="Best seller" {...register('isBestSeller')} />
              <Checkbox label="New arrival" {...register('isNewArrival')} />
              <Checkbox label="Gift box" {...register('isGiftBox')} />
            </div>
            <Button type="submit" isLoading={updateMutation.isPending} className="self-end">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
