'use client';

import { useRouter } from 'next/navigation';
import { Badge, DataTable, ErrorState, ForbiddenState } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useCmsPagesQuery } from '@/features/cms/api';
import type { CmsPage } from '@/features/cms/types';

export default function CmsPagesPage() {
  const router = useRouter();
  const { data: pages, isLoading, isError, error } = useCmsPagesQuery();

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="CMS" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="CMS" description="About, Contact, FAQ, Privacy Policy, and Terms of Service — the five pages the storefront reads publicly." />
      <DataTable
        columns={[
          { key: 'title', header: 'Page', render: (row: CmsPage) => row.title },
          { key: 'slug', header: 'Slug', render: (row: CmsPage) => <span className="font-mono text-xs">{row.slug}</span> },
          {
            key: 'status',
            header: 'Status',
            render: (row: CmsPage) => <Badge tone={row.status === 'PUBLISHED' ? 'success' : 'neutral'}>{row.status}</Badge>,
          },
          {
            key: 'updatedAt',
            header: 'Last updated',
            render: (row: CmsPage) => new Date(row.updatedAt).toLocaleDateString(),
          },
        ]}
        rows={pages ?? []}
        rowKey={(row) => row.slug}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/cms/${row.slug}`)}
        emptyTitle="No pages yet"
        emptyDescription="Pages are seeded automatically — this should never be empty."
      />
    </div>
  );
}
