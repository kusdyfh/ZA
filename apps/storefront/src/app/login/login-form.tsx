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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get('redirect') ?? '/account');
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    // Brand-token skin matching the rest of the theme-aware chrome (ADR
    // 0029 §11) — was fully generic before, including a stray `pink-700`
    // link accent left over from the pre-brand shared Tailwind scale.
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16 sm:px-6">
        <Heading
          level={2}
          as="h1"
          className="text-brand-ink text-center dark:text-neutral-50"
        >
          Sign in
        </Heading>
        <Card className="rounded-brand-lg border-brand-petal-100 bg-brand-paper shadow-brand-tight dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={onSubmit}
              noValidate
            >
              {formError && (
                <p
                  role="alert"
                  className="bg-danger-500/10 text-danger-500 rounded-sm px-3 py-2 text-sm"
                >
                  {formError}
                </p>
              )}
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                errorText={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                errorText={errors.password?.message}
                {...register('password')}
              />
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
              >
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-brand-mauve text-center text-sm dark:text-neutral-400">
          New here?{' '}
          <Link
            href="/register"
            className="text-brand-plum font-medium hover:underline dark:text-pink-300"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
