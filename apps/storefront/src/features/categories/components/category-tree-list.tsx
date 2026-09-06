'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EmptyState, Skeleton } from '@za/ui';
import { useCategoryTreeQuery } from '../api';
import type { CategoryTreeNode } from '../types';

function CategoryNode({ node }: { node: CategoryTreeNode }) {
  if (!node.category.isActive) {
    return null;
  }
  return (
    <li>
      <Link
        href={`/categories/${node.category.slug}`}
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        {node.category.name}
        <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </Link>
      {node.children.length > 0 && (
        <ul className="ms-4 border-s border-neutral-200 ps-2 dark:border-neutral-800">
          {node.children.map((child) => (
            <CategoryNode key={child.category.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTreeList() {
  const { data: tree, isLoading, isError } = useCategoryTreeQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-danger-500">Could not load categories.</p>;
  }

  if (!tree || tree.length === 0) {
    return <EmptyState title="No categories yet" />;
  }

  return (
    <ul className="flex flex-col gap-1">
      {tree.map((node) => (
        <CategoryNode key={node.category.id} node={node} />
      ))}
    </ul>
  );
}
