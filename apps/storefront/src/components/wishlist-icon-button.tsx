'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useWishlistQuery } from '@/features/wishlist/api';

export function WishlistIconButton() {
  const { isAuthenticated } = useCustomerAuth();
  const { data: wishlist } = useWishlistQuery();
  const count = isAuthenticated ? (wishlist?.length ?? 0) : 0;

  return (
    <Link
      href={isAuthenticated ? '/account/wishlist' : '/login?redirect=/account/wishlist'}
      aria-label={`Wishlist${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Heart className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
