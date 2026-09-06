'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Spinner, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import {
  type ProductSpecificationEntry,
  useProductSpecificationsQuery,
  useSetProductSpecificationsMutation,
} from '@/features/products/specifications-api';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export function SpecificationsTab({ productId }: { productId: string }) {
  const { data, isLoading } = useProductSpecificationsQuery(productId);
  const setSpecsMutation = useSetProductSpecificationsMutation(productId);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ProductSpecificationEntry[]>([]);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (data && !isSynced) {
      setEntries(data.map((item) => ({ label: item.label, value: item.value })));
      setIsSynced(true);
    }
  }, [data, isSynced]);

  function updateEntry(index: number, patch: Partial<ProductSpecificationEntry>) {
    setEntries((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    setEntries((current) => [...current, { label: '', value: '' }]);
  }

  function removeEntry(index: number) {
    setEntries((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      await setSpecsMutation.mutateAsync(entries);
      showToast({ tone: 'success', title: 'Specifications saved' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not save specifications', description: describeError(error) });
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
      {entries.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No specifications yet — add a label/value pair below (e.g. &ldquo;Material&rdquo; / &ldquo;100% cotton&rdquo;).
        </p>
      )}
      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-end gap-3">
            <Input
              label="Label"
              value={entry.label}
              onChange={(event) => updateEntry(index, { label: event.target.value })}
              className="flex-1"
            />
            <Input
              label="Value"
              value={entry.value}
              onChange={(event) => updateEntry(index, { value: event.target.value })}
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Remove specification"
              onClick={() => removeEntry(index)}
              className="mb-2 rounded-md p-1.5 text-neutral-500 hover:bg-danger-500/10 hover:text-danger-500 dark:text-neutral-400"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" leadingIcon={<Plus className="h-4 w-4" />} onClick={addEntry}>
          Add specification
        </Button>
        <Button isLoading={setSpecsMutation.isPending} onClick={handleSave}>
          Save specifications
        </Button>
      </div>
    </div>
  );
}
