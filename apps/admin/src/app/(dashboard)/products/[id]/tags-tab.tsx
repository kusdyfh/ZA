'use client';

import { useState } from 'react';
import { Button, Callout, Checkbox, Spinner, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useTagsQuery } from '@/features/tags/api';
import { useSetProductTagsMutation } from '@/features/products/api';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export function TagsTab({ productId }: { productId: string }) {
  const { data: tags, isLoading } = useTagsQuery({ limit: 100 });
  const setTagsMutation = useSetProductTagsMutation();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(tagId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  async function handleSave() {
    try {
      await setTagsMutation.mutateAsync({ id: productId, tagIds: Array.from(selected) });
      showToast({ tone: 'success', title: 'Tags saved' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not save tags', description: describeError(error) });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Callout tone="warning">
        There is no endpoint to read a product&rsquo;s currently-assigned tags, only to replace the
        full set — every checkbox below starts unchecked. Select every tag this product should
        have, then save; saving replaces the entire set rather than adding to it.
      </Callout>
      <div className="flex flex-wrap gap-4">
        {(tags?.data ?? []).map((tag) => (
          <Checkbox key={tag.id} label={tag.name} checked={selected.has(tag.id)} onChange={() => toggle(tag.id)} />
        ))}
        {(tags?.data ?? []).length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tags exist yet — create some under Catalog → Tags.</p>
        )}
      </div>
      <Button className="self-end" isLoading={setTagsMutation.isPending} onClick={handleSave}>
        Save tags
      </Button>
    </div>
  );
}
