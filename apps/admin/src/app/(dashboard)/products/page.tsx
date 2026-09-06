'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Badge, Button, DataTable, ErrorState, Input, Pagination, Select } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useTableState } from '@/lib/hooks/use-table-state';
import { useProductsQuery } from '@/features/products/api';
import type { Product, ProductStatus } from '@/features/products/types';
import { PRODUCT_STATUSES } from '@/features/products/types';
import { useState } from 'react';

const STATUS_TONE: Record<ProductStatus, 'neutral' | 'success'> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

export default function ProductsPage() {
  const router = useRouter();
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } =
    useTableState();
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const { data, isLoading, isError } = useProductsQuery({
    page,
    limit,
    search,
    sort: sortParam,
    status: status || undefined,
  });

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Everything sold in the store — variants, media, and specifications live on each product's detail page."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => router.push('/products/new')}>
            Add product
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products"
          className="max-w-xs"
        />
        <Select
          aria-label="Filter by status"
          className="w-40"
          value={status}
          onChange={(event) => setStatus(event.target.value as ProductStatus | '')}
          placeholder="All statuses"
          options={PRODUCT_STATUSES.map((value) => ({ value, label: value }))}
        />
      </div>
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (row: Product) => (
              <Link href={`/products/${row.id}`} className="font-medium text-pink-700 hover:underline dark:text-pink-300">
                {row.name}
              </Link>
            ),
          },
          { key: 'sku', header: 'SKU', sortable: true, render: (row: Product) => row.sku },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row: Product) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
          },
          {
            key: 'price',
            header: 'Price',
            sortable: true,
            align: 'right',
            render: (row: Product) => `${row.currency} ${row.price}`,
          },
        ]}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        sort={sort}
        onSortChange={toggleSort}
        onRowClick={(row) => router.push(`/products/${row.id}`)}
        emptyTitle="No products yet"
        emptyDescription="Add your first product to start building the catalog."
        emptyAction={<Button onClick={() => router.push('/products/new')}>Add product</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}
    </div>
  );
}
