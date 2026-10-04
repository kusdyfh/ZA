'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Heading,
  Input,
  useToast,
} from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from '@/features/customer/api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(10, 'Must be at least 10 characters'),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function ProfileForm() {
  const { customer, refreshCustomer } = useCustomerAuth();
  const updateMutation = useUpdateProfileMutation();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      phone: customer?.phone ?? '',
      marketingOptIn: customer?.marketingOptIn ?? false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        ...values,
        marketingOptIn: values.marketingOptIn ?? false,
      });
      await refreshCustomer();
      showToast({ tone: 'success', title: 'Profile updated' });
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not update profile',
        description: describeError(error),
      });
    }
  });

  return (
    <Card className="rounded-brand-lg border-brand-petal-100 bg-brand-paper shadow-brand-tight dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-brand-ink dark:text-neutral-50">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input label="Email" value={customer?.email ?? ''} disabled />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              errorText={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              errorText={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <Input label="Phone" {...register('phone')} />
          <Checkbox
            label="Email me about new arrivals and offers"
            {...register('marketingOptIn')}
          />
          <Button
            type="submit"
            isLoading={updateMutation.isPending}
            className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry self-end"
          >
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordForm() {
  const changePasswordMutation = useChangePasswordMutation();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePasswordMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Password changed' });
      reset();
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not change password',
        description: describeError(error),
      });
    }
  });

  return (
    <Card className="rounded-brand-lg border-brand-petal-100 bg-brand-paper shadow-brand-tight dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-brand-ink dark:text-neutral-50">
          Change password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            errorText={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            helperText="At least 10 characters"
            errorText={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Button
            type="submit"
            isLoading={changePasswordMutation.isPending}
            className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry self-end"
          >
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AccountContent() {
  const { logout } = useCustomerAuth();

  return (
    // Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11).
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink dark:text-neutral-50"
          >
            My account
          </Heading>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush"
          >
            Sign out
          </Button>
        </div>

        <nav className="mb-6 flex gap-4 text-sm">
          <Link
            href="/account/addresses"
            className="text-brand-plum font-medium hover:underline dark:text-pink-300"
          >
            Addresses
          </Link>
          <Link
            href="/account/orders"
            className="text-brand-plum font-medium hover:underline dark:text-pink-300"
          >
            Order history
          </Link>
          <Link
            href="/account/wishlist"
            className="text-brand-plum font-medium hover:underline dark:text-pink-300"
          >
            Wishlist
          </Link>
        </nav>

        <div className="flex flex-col gap-6">
          <ProfileForm />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireCustomerAuth>
      <AccountContent />
    </RequireCustomerAuth>
  );
}
