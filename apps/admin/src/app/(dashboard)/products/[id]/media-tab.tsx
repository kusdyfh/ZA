'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Callout,
  Checkbox,
  Input,
  Select,
  Spinner,
  useToast,
} from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useColorsQuery } from '@/features/colors/api';
import {
  type ProductMediaEntry,
  useProductMediaQuery,
  useSetProductMediaMutation,
} from '@/features/products/media-api';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export function MediaTab({ productId }: { productId: string }) {
  const { data, isLoading } = useProductMediaQuery(productId);
  const { data: colors } = useColorsQuery({ limit: 100 });
  const setMediaMutation = useSetProductMediaMutation(productId);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ProductMediaEntry[]>([]);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (data && !isSynced) {
      setEntries(
        data.map((item) => ({
          type: item.type,
          url: item.url,
          altText: item.altText ?? '',
          isCover: item.isCover,
          colorId: item.colorId,
        })),
      );
      setIsSynced(true);
    }
  }, [data, isSynced]);

  function updateEntry(index: number, patch: Partial<ProductMediaEntry>) {
    setEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  function addEntry() {
    setEntries((current) => [
      ...current,
      {
        type: 'IMAGE',
        url: '',
        altText: '',
        isCover: current.length === 0,
        colorId: null,
      },
    ]);
  }

  function removeEntry(index: number) {
    setEntries((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      await setMediaMutation.mutateAsync(entries);
      showToast({ tone: 'success', title: 'Media saved' });
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not save media',
        description: describeError(error),
      });
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
      <Callout>
        Saving replaces the product&rsquo;s entire media set — every image and
        video below is sent together. Alt text is required by the design
        system&rsquo;s accessibility rule for every image.
      </Callout>
      {entries.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No media yet — add an image or video below.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr]">
              <Select
                label="Type"
                value={entry.type}
                onChange={(event) =>
                  updateEntry(index, {
                    type: event.target.value as 'IMAGE' | 'VIDEO',
                  })
                }
                options={[
                  { value: 'IMAGE', label: 'Image' },
                  { value: 'VIDEO', label: 'Video' },
                ]}
              />
              <Input
                label="URL"
                value={entry.url}
                onChange={(event) =>
                  updateEntry(index, { url: event.target.value })
                }
              />
            </div>
            <Input
              label="Alt text"
              value={entry.altText ?? ''}
              onChange={(event) =>
                updateEntry(index, { altText: event.target.value })
              }
            />
            <Select
              label="Color"
              value={entry.colorId ?? ''}
              onChange={(event) =>
                updateEntry(index, { colorId: event.target.value || null })
              }
              options={[
                { value: '', label: 'All colors (shared)' },
                ...(colors?.data ?? []).map((color) => ({
                  value: color.id,
                  label: color.name,
                })),
              ]}
            />
            <div className="flex items-center justify-between">
              <Checkbox
                label="Cover image"
                checked={entry.isCover}
                onChange={(event) =>
                  setEntries((current) =>
                    current.map((item, i) => ({
                      ...item,
                      isCover: i === index ? event.target.checked : false,
                    })),
                  )
                }
              />
              <button
                type="button"
                aria-label="Remove media item"
                onClick={() => removeEntry(index)}
                className="hover:bg-danger-500/10 hover:text-danger-500 rounded-md p-1.5 text-neutral-500 dark:text-neutral-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button
          variant="outline"
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={addEntry}
        >
          Add media
        </Button>
        <Button isLoading={setMediaMutation.isPending} onClick={handleSave}>
          Save media
        </Button>
      </div>
    </div>
  );
}
