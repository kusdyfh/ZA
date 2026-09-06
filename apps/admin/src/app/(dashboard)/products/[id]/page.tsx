'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ErrorState, Spinner, Tabs } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useProductQuery } from '@/features/products/api';
import { DetailsTab } from './details-tab';
import { VariantsTab } from './variants-tab';
import { MediaTab } from './media-tab';
import { SpecificationsTab } from './specifications-tab';
import { TagsTab } from './tags-tab';

const TAB_ITEMS = [
  { key: 'details', label: 'Details' },
  { key: 'variants', label: 'Variants' },
  { key: 'media', label: 'Media' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'tags', label: 'Tags' },
];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const [activeTab, setActiveTab] = useState('details');
  const { data: product, isLoading, isError } = useProductQuery(productId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError || !product) {
    return <ErrorState title="Product not found" description="It may have been deleted, or the id is wrong." />;
  }

  return (
    <div>
      <PageHeader title={product.name} description={`SKU ${product.sku}`} />
      <Tabs items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} className="mb-6" />
      {activeTab === 'details' && <DetailsTab product={product} />}
      {activeTab === 'variants' && <VariantsTab productId={productId} />}
      {activeTab === 'media' && <MediaTab productId={productId} />}
      {activeTab === 'specifications' && <SpecificationsTab productId={productId} />}
      {activeTab === 'tags' && <TagsTab productId={productId} />}
    </div>
  );
}
