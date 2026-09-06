'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, EmptyState, Heading, Skeleton, useToast } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import { useRemoveWishlistItemMutation, useWishlistQuery } from '@/features/wishlist/api';

function WishlistContent() {
  const router = useRouter();
  const { data: wishlist, isLoading } = useWishlistQuery();
  const removeMutation = useRemoveWishlistItemMutation();
  const { showToast } = useToast();

  async function remove(productId: string) {
    try {
      await removeMutation.mutateAsync(productId);
      showToast({ tone: 'success', title: 'Removed from wishlist' });
    } catch {
      showToast({ tone: 'danger', title: 'Could not remove item' });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save products you love to find them again easily."
        action={<Button onClick={() => router.push('/shop')}>Browse the shop</Button>}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {wishlist.map((item) => (
        <li key={item.productId} className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div>
            <Link href={`/products/${item.slug}`} className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
              {item.productName}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {formatCurrency(item.price, { currency: item.currencyCode })}
              </span>
              {item.availability === 'NO_LONGER_AVAILABLE' && <Badge tone="neutral">No longer available</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => remove(item.productId)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function WishlistPage() {
  return (
    <RequireCustomerAuth>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Heading level={2} as="h1" className="mb-6">
          Wishlist
        </Heading>
        <WishlistContent />
      </div>
    </RequireCustomerAuth>
  );
}
