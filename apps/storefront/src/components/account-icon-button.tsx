'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useCustomerAuth } from '@/lib/auth/auth-context';

export function AccountIconButton() {
  const { isAuthenticated } = useCustomerAuth();

  return (
    <Link
      href={isAuthenticated ? '/account' : '/login'}
      aria-label={isAuthenticated ? 'Your account' : 'Sign in'}
      className="text-brand-plum hover:bg-brand-petal-100 focus-visible:shadow-focus inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none"
    >
      <UserRound
        className="h-[22px] w-[22px]"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </Link>
  );
}
