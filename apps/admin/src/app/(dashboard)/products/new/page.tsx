'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, CardContent, Checkbox, Input, Select, Textarea, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useCreateProductMutation } from '@/features/products/api';
import { useAllCategoriesQuery } from '@/features/categories/api';
import { useBrandsQuery } from '@/features/brands/api';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  discountPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isGiftBox: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateProductMutation();
  const { data: categories } = useAllCategoriesQuery();
  const { data: brands } = useBrandsQuery({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Product created' });
      router.push(`/products/${created.id}`);
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not create product',
        description: error instanceof ApiError ? error.message : 'Something went wrong.',
      });
    }
  });

  return (
    <div>
      <PageHeader title="Add product" description="Variants, media, and specifications can be added after creating the product." />
      <Card className="max-w-2xl">
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" errorText={errors.name?.message} {...register('name')} />
              <Input label="SKU" errorText={errors.sku?.message} {...register('sku')} />
            </div>
            <Input label="Slug" helperText="Leave blank to auto-generate" {...register('slug')} />
            <Textarea label="Short description" {...register('shortDescription')} />
            <Textarea label="Description" rows={6} {...register('description')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Price" type="number" step="0.01" errorText={errors.price?.message} {...register('price')} />
              <Input label="Discount price" type="number" step="0.01" {...register('discountPrice')} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                placeholder="Select a category"
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
            <Button type="submit" isLoading={createMutation.isPending} className="self-end">
              Create product
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
