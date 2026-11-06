'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, UploadCloud } from 'lucide-react';
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
  uploadProductMediaFile,
} from '@/features/products/media-api';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

/** Bare filename, no extension — a reasonable starting alt text the admin can edit. */
function altTextFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^./]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

export function MediaTab({ productId }: { productId: string }) {
  const { data, isLoading } = useProductMediaQuery(productId);
  const { data: colors } = useColorsQuery({ limit: 100 });
  const setMediaMutation = useSetProductMediaMutation(productId);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ProductMediaEntry[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (files.length === 0) {
      return;
    }
    const noCoverYet = !entries.some((entry) => entry.isCover);
    setUploadingFiles((current) => [
      ...current,
      ...files.map((file) => file.name),
    ]);
    await Promise.all(
      files.map(async (file) => {
        try {
          const url = await uploadProductMediaFile(file);
          setEntries((current) => [
            ...current,
            {
              type: 'IMAGE',
              url,
              altText: altTextFromFileName(file.name),
              isCover: noCoverYet && !current.some((entry) => entry.isCover),
              colorId: null,
            },
          ]);
        } catch (error) {
          showToast({
            tone: 'danger',
            title: `Could not upload ${file.name}`,
            description: describeError(error),
          });
        } finally {
          setUploadingFiles((current) => {
            const nextIndex = current.indexOf(file.name);
            if (nextIndex === -1) {
              return current;
            }
            return [
              ...current.slice(0, nextIndex),
              ...current.slice(nextIndex + 1),
            ];
          });
        }
      }),
    );
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600'
        }`}
      >
        <UploadCloud className="h-8 w-8 text-neutral-400" aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Drag &amp; drop images here, or click to browse
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          JPEG, PNG, WEBP or GIF — up to 10&nbsp;MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />
      </div>
      {uploadingFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploadingFiles.map((fileName) => (
            <div
              key={fileName}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
            >
              <Spinner className="h-4 w-4" />
              Uploading {fileName}…
            </div>
          ))}
        </div>
      )}
      {entries.length === 0 && uploadingFiles.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No media yet — drop an image above, or add a video by URL below.
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
