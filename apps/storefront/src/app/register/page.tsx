'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, CardContent, Checkbox, Heading, Input } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(10, 'Must be at least 10 characters'),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerCustomer } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await registerCustomer(values);
      router.push('/account');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to create an account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16 sm:px-6">
      <Heading level={2} as="h1" className="text-center">
        Create an account
      </Heading>
      <Card>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            {formError && (
              <p role="alert" className="rounded-sm bg-danger-500/10 px-3 py-2 text-sm text-danger-500">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" errorText={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last name" errorText={errors.lastName?.message} {...register('lastName')} />
            </div>
            <Input label="Email" type="email" autoComplete="email" errorText={errors.email?.message} {...register('email')} />
            <Input label="Phone (optional)" {...register('phone')} />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              helperText="At least 10 characters"
              errorText={errors.password?.message}
              {...register('password')}
            />
            <Checkbox label="Email me about new arrivals and offers" {...register('marketingOptIn')} />
            <Button type="submit" isLoading={isSubmitting}>
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-pink-700 hover:underline dark:text-pink-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
