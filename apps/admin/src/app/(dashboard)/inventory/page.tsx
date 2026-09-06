'use client';

import { useState } from 'react';
import { Tabs } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { WarehousesTab } from './warehouses-tab';
import { StockTab } from './stock-tab';
import { LowStockTab } from './low-stock-tab';
import { ReservationsTab } from './reservations-tab';

const TAB_ITEMS = [
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'stock', label: 'Stock' },
  { key: 'low-stock', label: 'Low Stock' },
  { key: 'reservations', label: 'Reservations' },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('warehouses');

  return (
    <div>
      <PageHeader title="Inventory" description="Warehouses, stock levels, and checkout reservations." />
      <Tabs items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} className="mb-6" />
      {activeTab === 'warehouses' && <WarehousesTab />}
      {activeTab === 'stock' && <StockTab />}
      {activeTab === 'low-stock' && <LowStockTab />}
      {activeTab === 'reservations' && <ReservationsTab />}
    </div>
  );
}
