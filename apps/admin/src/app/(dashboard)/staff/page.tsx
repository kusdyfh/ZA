'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, ShieldCheck } from 'lucide-react';
import { Badge, Button, DataTable, Dialog, ErrorState, ForbiddenState, Input, Pagination, Select, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { useTableState } from '@/lib/hooks/use-table-state';
import { ApiError } from '@/lib/api/client';
import {
  useActivateAdminUserMutation,
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeactivateAdminUserMutation,
  useRolesQuery,
  useUpdateAdminUserRoleMutation,
} from '@/features/identity/api';
import type { AdminUser } from '@/features/identity/types';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(10, 'Must be at least 10 characters'),
  roleId: z.string().min(1, 'Choose a role'),
});

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export default function StaffPage() {
  const { page, limit, search, sort, setPage, setLimit, setSearch, toggleSort, sortParam } = useTableState();
  const { data, isLoading, isError, error } = useAdminUsersQuery({ page, limit, search, sort: sortParam });
  const { data: roles } = useRolesQuery();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reassigningUser, setReassigningUser] = useState<AdminUser | null>(null);

  const createMutation = useCreateAdminUserMutation();
  const activateMutation = useActivateAdminUserMutation();
  const deactivateMutation = useDeactivateAdminUserMutation();
  const roleMutation = useUpdateAdminUserRoleMutation();

  const createForm = useForm<z.infer<typeof createSchema>>({ resolver: zodResolver(createSchema) });

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Staff account created' });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (createError) {
      showToast({ tone: 'danger', title: 'Could not create account', description: describeError(createError) });
    }
  });

  async function toggleActive(user: AdminUser) {
    try {
      if (user.isActive) {
        await deactivateMutation.mutateAsync(user.id);
        showToast({ tone: 'success', title: `${user.name} deactivated` });
      } else {
        await activateMutation.mutateAsync(user.id);
        showToast({ tone: 'success', title: `${user.name} activated` });
      }
    } catch (toggleError) {
      showToast({ tone: 'danger', title: 'Could not update account', description: describeError(toggleError) });
    }
  }

  async function handleReassign(roleId: string) {
    if (!reassigningUser) return;
    try {
      await roleMutation.mutateAsync({ id: reassigningUser.id, roleId });
      showToast({ tone: 'success', title: 'Role updated' });
      setReassigningUser(null);
    } catch (reassignError) {
      showToast({ tone: 'danger', title: 'Could not update role', description: describeError(reassignError) });
    }
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="Staff" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  const roleName = (roleId: string) => roles?.find((role) => role.id === roleId)?.name ?? roleId;

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Admin accounts and the role each one is assigned."
        action={
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Add staff account
          </Button>
        }
      />
      <div className="mb-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search staff"
          className="max-w-xs"
        />
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true, render: (row: AdminUser) => row.name },
          { key: 'email', header: 'Email', sortable: true, render: (row: AdminUser) => row.email },
          { key: 'roleId', header: 'Role', render: (row: AdminUser) => roleName(row.roleId) },
          {
            key: 'isActive',
            header: 'Status',
            sortable: true,
            render: (row: AdminUser) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: AdminUser) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" leadingIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => setReassigningUser(row)}>
                  Change role
                </Button>
                <Button size="sm" variant={row.isActive ? 'destructive' : 'outline'} onClick={() => toggleActive(row)}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        sort={sort}
        onSortChange={toggleSort}
        emptyTitle="No staff accounts yet"
        emptyAction={<Button onClick={() => setIsCreateOpen(true)}>Add staff account</Button>}
      />
      {data && (
        <Pagination page={page} totalPages={data.meta.totalPages} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add staff account">
        <form className="flex flex-col gap-4" onSubmit={onCreate} noValidate>
          <Input label="Name" errorText={createForm.formState.errors.name?.message} {...createForm.register('name')} />
          <Input label="Email" type="email" errorText={createForm.formState.errors.email?.message} {...createForm.register('email')} />
          <Input
            label="Temporary password"
            type="password"
            helperText="At least 10 characters"
            errorText={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Select
            label="Role"
            placeholder="Choose a role"
            options={(roles ?? []).map((role) => ({ value: role.id, label: role.name }))}
            errorText={createForm.formState.errors.roleId?.message}
            {...createForm.register('roleId')}
          />
          <Button type="submit" isLoading={createMutation.isPending} className="self-end">
            Create account
          </Button>
        </form>
      </Dialog>

      <Dialog open={reassigningUser !== null} onClose={() => setReassigningUser(null)} title={`Change ${reassigningUser?.name}'s role`}>
        <div className="flex flex-col gap-4">
          <Select
            label="New role"
            placeholder="Choose a role"
            defaultValue={reassigningUser?.roleId}
            options={(roles ?? []).map((role) => ({ value: role.id, label: role.name }))}
            onChange={(event) => handleReassign(event.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
