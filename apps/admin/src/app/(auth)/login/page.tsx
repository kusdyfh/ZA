'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, CardContent, Input } from '@za/ui';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      router.push('/');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {formError && (
            <p role="alert" className="rounded-sm bg-danger-500/10 px-3 py-2 text-sm text-danger-500">
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
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              errorText={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute end-3 top-9 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
