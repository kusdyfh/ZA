'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, CardContent, Heading, Input } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), mode: 'onBlur' });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get('redirect') ?? '/account');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16 sm:px-6">
      <Heading level={2} as="h1" className="text-center">
        Sign in
      </Heading>
      <Card>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            {formError && (
              <p role="alert" className="rounded-sm bg-danger-500/10 px-3 py-2 text-sm text-danger-500">
                {formError}
              </p>
            )}
            <Input label="Email" type="email" autoComplete="email" errorText={errors.email?.message} {...register('email')} />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              errorText={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        New here?{' '}
        <Link href="/register" className="font-medium text-pink-700 hover:underline dark:text-pink-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
