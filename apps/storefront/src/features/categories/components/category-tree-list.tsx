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
        className="rounded-brand-md text-brand-ink hover:bg-brand-blush flex items-center justify-between px-3 py-2 text-sm font-medium dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        {node.category.name}
        <ChevronRight
          className="text-brand-dusty h-4 w-4 dark:text-neutral-400"
          aria-hidden="true"
        />
      </Link>
      {node.children.length > 0 && (
        <ul className="border-brand-petal-100 ms-4 border-s ps-2 dark:border-neutral-800">
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
          <Skeleton
            key={index}
            className="bg-brand-blush h-10 w-full dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-danger-500 text-sm">Could not load categories.</p>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
        iconClassName="text-brand-dusty dark:text-neutral-500"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {tree.map((node) => (
        <CategoryNode key={node.category.id} node={node} />
      ))}
    </ul>
  );
}
