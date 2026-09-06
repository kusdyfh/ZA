'use client';

import { useState } from 'react';
import { Badge, DataTable, Select } from '@za/ui';
import { type VariantStock, useLowStockQuery, useWarehousesQuery } from '@/features/inventory/api';

export function LowStockTab() {
  const [warehouseId, setWarehouseId] = useState('');
  const { data: warehouses } = useWarehousesQuery();
  const { data: lowStock, isLoading, isError } = useLowStockQuery(warehouseId || undefined);

  return (
    <div className="flex flex-col gap-4">
      <Select
        aria-label="Filter by warehouse"
        className="max-w-xs"
        value={warehouseId}
        onChange={(event) => setWarehouseId(event.target.value)}
        placeholder="All warehouses"
        options={(warehouses ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
      />
      <DataTable
        columns={[
          { key: 'variantId', header: 'Variant ID', render: (row: VariantStock) => <span className="font-mono text-xs">{row.variantId}</span> },
          { key: 'quantity', header: 'On hand', align: 'right', render: (row: VariantStock) => row.quantity },
          { key: 'available', header: 'Available', align: 'right', render: (row: VariantStock) => row.available },
          { key: 'lowStockThreshold', header: 'Threshold', align: 'right', render: (row: VariantStock) => row.lowStockThreshold ?? '—' },
          { key: 'status', header: 'Status', render: () => <Badge tone="warning">Low stock</Badge> },
        ]}
        rows={isError ? [] : (lowStock ?? [])}
        rowKey={(row) => `${row.variantId}:${row.warehouseId}`}
        isLoading={isLoading}
        emptyTitle="Nothing is running low"
        emptyDescription="Every variant is above its low-stock threshold."
      />
    </div>
  );
}
