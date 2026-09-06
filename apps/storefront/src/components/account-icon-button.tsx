'use client';

import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { useCustomerAuth } from '@/lib/auth/auth-context';

export function AccountIconButton() {
  const { isAuthenticated } = useCustomerAuth();

  return (
    <Link
      href={isAuthenticated ? '/account' : '/login'}
      aria-label={isAuthenticated ? 'Your account' : 'Sign in'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <UserCircle className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
