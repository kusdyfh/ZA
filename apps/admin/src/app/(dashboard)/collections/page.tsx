'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Callout, Card, CardContent, CardHeader, CardTitle, Input, Spinner, Text, Textarea, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import {
  type Collection,
  useCollectionProductsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useSetCollectionActiveMutation,
  useSetCollectionProductsMutation,
  useUpdateCollectionMutation,
} from '@/features/collections/api';

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function CreateCollectionCard({ onCreated }: { onCreated: (collection: Collection) => void }) {
  const createMutation = useCreateCollectionMutation();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormValues>({ resolver: zodResolver(collectionSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Collection created', description: `id: ${created.id}` });
      onCreated(created);
      reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not create collection', description: describeError(error) });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a collection</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Input label="Name" errorText={errors.name?.message} {...register('name')} />
          <Input label="Slug" helperText="Leave blank to auto-generate" {...register('slug')} />
          <Textarea label="Description" {...register('description')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Starts at" type="date" {...register('startsAt')} />
            <Input label="Ends at" type="date" {...register('endsAt')} />
          </div>
          <Button type="submit" isLoading={createMutation.isPending} className="self-end">
            Create
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ManageCollectionCard({ initialId }: { initialId: string }) {
  const [collectionId, setCollectionId] = useState(initialId);
  const [lookupId, setLookupId] = useState(initialId || null);
  const { showToast } = useToast();

  const productsQuery = useCollectionProductsQuery(lookupId ?? '', Boolean(lookupId));
  const updateMutation = useUpdateCollectionMutation();
  const setActiveMutation = useSetCollectionActiveMutation();
  const setProductsMutation = useSetCollectionProductsMutation();
  const deleteMutation = useDeleteCollectionMutation();

  const {
    register,
    handleSubmit,
  } = useForm<CollectionFormValues>({ resolver: zodResolver(collectionSchema.partial()) });
  const [productIdsText, setProductIdsText] = useState('');

  const onUpdate = handleSubmit(async (values) => {
    if (!lookupId) return;
    try {
      await updateMutation.mutateAsync({ id: lookupId, values });
      showToast({ tone: 'success', title: 'Collection updated' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update collection', description: describeError(error) });
    }
  });

  async function handleSetActive(isActive: boolean) {
    if (!lookupId) return;
    try {
      await setActiveMutation.mutateAsync({ id: lookupId, isActive });
      showToast({ tone: 'success', title: isActive ? 'Collection activated' : 'Collection deactivated' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not change status', description: describeError(error) });
    }
  }

  async function handleSetProducts() {
    if (!lookupId) return;
    const productIds = productIdsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    try {
      await setProductsMutation.mutateAsync({ id: lookupId, productIds });
      showToast({ tone: 'success', title: 'Product set updated' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update products', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!lookupId) return;
    try {
      await deleteMutation.mutateAsync(lookupId);
      showToast({ tone: 'success', title: 'Collection deleted' });
      setLookupId(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete collection', description: describeError(error) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage an existing collection</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Callout>
          There is no endpoint to list or look up a collection&rsquo;s own fields by id — only its
          product set is publicly readable. Enter a known collection id to manage it; edits are
          applied blind (the form doesn&rsquo;t prefill) but the server confirms each change.
        </Callout>
        <div className="flex items-end gap-3">
          <Input
            label="Collection ID"
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={() => setLookupId(collectionId || null)}>
            Load
          </Button>
        </div>

        {lookupId && (
          <>
            <div>
              <Text size="sm" muted>
                Products currently in this collection
              </Text>
              {productsQuery.isLoading && <Spinner className="mt-2" />}
              {productsQuery.isError && (
                <Text size="sm" className="mt-2 text-danger-500">
                  Could not load — check the collection id is correct.
                </Text>
              )}
              {productsQuery.data && (
                <ul className="mt-2 list-inside list-disc text-sm text-neutral-700 dark:text-neutral-300">
                  {productsQuery.data.length === 0 && <li>No products in this collection yet.</li>}
                  {productsQuery.data.map((product) => (
                    <li key={product.id}>
                      {product.name} ({product.sku})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="flex flex-col gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800" onSubmit={onUpdate} noValidate>
              <Text size="sm" muted>
                Update fields (leave blank to leave unchanged)
              </Text>
              <Input label="Name" {...register('name')} />
              <Input label="Slug" {...register('slug')} />
              <Textarea label="Description" {...register('description')} />
              <Button type="submit" isLoading={updateMutation.isPending} className="self-end">
                Save fields
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button variant="outline" onClick={() => handleSetActive(true)} isLoading={setActiveMutation.isPending}>
                Activate
              </Button>
              <Button variant="outline" onClick={() => handleSetActive(false)} isLoading={setActiveMutation.isPending}>
                Deactivate
              </Button>
              <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
                Delete collection
              </Button>
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Textarea
                label="Product IDs (comma-separated) — replaces the full set"
                value={productIdsText}
                onChange={(event) => setProductIdsText(event.target.value)}
              />
              <Button onClick={handleSetProducts} isLoading={setProductsMutation.isPending} className="self-end">
                Set products
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CollectionsPage() {
  const [lastCreatedId, setLastCreatedId] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Collections"
        description="Curated, time-boxed product groupings (e.g. seasonal launches)."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CreateCollectionCard onCreated={(collection) => setLastCreatedId(collection.id)} />
        <ManageCollectionCard key={lastCreatedId} initialId={lastCreatedId} />
      </div>
    </div>
  );
}
