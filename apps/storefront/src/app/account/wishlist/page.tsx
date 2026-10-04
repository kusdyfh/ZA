'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, EmptyState, Heading, Skeleton, useToast } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { RequireCustomerAuth } from '@/components/require-customer-auth';
import {
  useRemoveWishlistItemMutation,
  useWishlistQuery,
} from '@/features/wishlist/api';

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
          <Skeleton
            key={index}
            className="bg-brand-blush h-20 w-full dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save products you love to find them again easily."
        action={
          <Button
            onClick={() => router.push('/shop')}
            className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
          >
            Browse the shop
          </Button>
        }
        className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
        iconClassName="text-brand-dusty dark:text-neutral-500"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {wishlist.map((item) => (
        <li
          key={item.productId}
          className="rounded-brand-md border-brand-petal-100 bg-brand-paper flex items-center justify-between gap-4 border p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <Link
              href={`/products/${item.slug}`}
              className="text-brand-ink font-medium hover:underline dark:text-neutral-100"
            >
              {item.productName}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-brand-mauve text-sm dark:text-neutral-400">
                {formatCurrency(item.price, { currency: item.currencyCode })}
              </span>
              {item.availability === 'NO_LONGER_AVAILABLE' && (
                <Badge tone="neutral">No longer available</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => remove(item.productId)}
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush"
          >
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
      {/* Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11). */}
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink mb-6 dark:text-neutral-50"
          >
            Wishlist
          </Heading>
          <WishlistContent />
        </div>
      </div>
    </RequireCustomerAuth>
  );
}
