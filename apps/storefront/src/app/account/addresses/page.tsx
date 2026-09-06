'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Checkbox, Dialog, EmptyState, Heading, Input, Skeleton, useToast } from '@za/ui';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import { ApiError } from '@/lib/api/client';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useUpdateAddressMutation,
} from '@/features/addresses/api';
import type { Address, AddressFormValues } from '@/features/addresses/types';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().optional(),
});

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function AddressForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema), defaultValues });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Full name" errorText={errors.fullName?.message} {...register('fullName')} />
      <Input label="Phone" errorText={errors.phone?.message} {...register('phone')} />
      <Input label="Address line 1" errorText={errors.line1?.message} {...register('line1')} />
      <Input label="Address line 2 (optional)" {...register('line2')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" errorText={errors.city?.message} {...register('city')} />
        <Input label="Governorate" errorText={errors.governorate?.message} {...register('governorate')} />
      </div>
      <Input label="Country" errorText={errors.country?.message} {...register('country')} />
      <Checkbox label="Set as default address" {...register('isDefault')} />
      <Button type="submit" isLoading={isSubmitting} className="self-end">
        Save
      </Button>
    </form>
  );
}

function AddressesContent() {
  const { data: addresses, isLoading } = useAddressesQuery();
  const createMutation = useCreateAddressMutation();
  const updateMutation = useUpdateAddressMutation();
  const deleteMutation = useDeleteAddressMutation();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  async function handleCreate(values: AddressFormValues) {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Address added' });
      setIsCreateOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not add address', description: describeError(error) });
    }
  }

  async function handleUpdate(values: AddressFormValues) {
    if (!editingAddress) return;
    try {
      await updateMutation.mutateAsync({ id: editingAddress.id, values });
      showToast({ tone: 'success', title: 'Address updated' });
      setEditingAddress(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update address', description: describeError(error) });
    }
  }

  async function handleDelete() {
    if (!deletingAddress) return;
    try {
      await deleteMutation.mutateAsync(deletingAddress.id);
      showToast({ tone: 'success', title: 'Address deleted' });
      setDeletingAddress(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not delete address', description: describeError(error) });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Heading level={2} as="h1">
          Addresses
        </Heading>
        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState
          title="No addresses yet"
          description="Add an address to speed through checkout next time."
          action={<Button onClick={() => setIsCreateOpen(true)}>Add address</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id}>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{address.fullName}</p>
                      {address.isDefault && <Badge tone="success">Default</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.governorate}, {address.country}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">{address.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Edit address for ${address.fullName}`}
                      onClick={() => setEditingAddress(address)}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete address for ${address.fullName}`}
                      onClick={() => setDeletingAddress(address)}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-danger-500/10 hover:text-danger-500 dark:text-neutral-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add address">
        <AddressForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
      </Dialog>

      <Dialog open={editingAddress !== null} onClose={() => setEditingAddress(null)} title="Edit address">
        {editingAddress && (
          <AddressForm
            defaultValues={{
              fullName: editingAddress.fullName,
              phone: editingAddress.phone,
              line1: editingAddress.line1,
              line2: editingAddress.line2 ?? undefined,
              city: editingAddress.city,
              governorate: editingAddress.governorate,
              country: editingAddress.country,
              isDefault: editingAddress.isDefault,
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingAddress !== null}
        onClose={() => setDeletingAddress(null)}
        title="Delete address"
        description={`Are you sure you want to delete this address? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingAddress(null)}>
              Cancel
            </Button>
            <Button variant="destructive" isLoading={deleteMutation.isPending} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireCustomerAuth>
      <AddressesContent />
    </RequireCustomerAuth>
  );
}
