'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShirtIcon } from 'lucide-react';
import { Badge } from '@za/ui';
import { cn, formatCurrency } from '@za/shared';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import {
  useAddWishlistItemMutation,
  useRemoveWishlistItemMutation,
  useWishlistQuery,
} from '@/features/wishlist/api';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * List views (featured/best-sellers/new-arrivals/shop/collection) only
 * return `ProductResponseDto`, which has no cover-media field — only
 * `ogImageUrl` (ADR 0021). Reused here as the card image rather than
 * fetching each product's media individually (would be an N+1 request
 * per grid, effectively re-implementing a listing endpoint client-side).
 * Falls back to a neutral placeholder when unset.
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const { isAuthenticated } = useCustomerAuth();
  const { data: wishlist } = useWishlistQuery();
  const addMutation = useAddWishlistItemMutation();
  const removeMutation = useRemoveWishlistItemMutation();

  const isWishlisted =
    wishlist?.some((entry) => entry.productId === product.id) ?? false;
  const hasDiscount =
    product.discountPrice !== null &&
    Number(product.discountPrice) < Number(product.price);

  function toggleWishlist(event: React.MouseEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (isWishlisted) {
      removeMutation.mutate(product.id);
    } else {
      addMutation.mutate(product.id);
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn('group block', className)}
    >
      <div className="rounded-brand-md bg-brand-blush relative aspect-square overflow-hidden dark:bg-neutral-800">
        {product.ogImageUrl ? (
          <Image
            src={product.ogImageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="text-brand-dusty flex h-full items-center justify-center dark:text-neutral-600">
            <ShirtIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {hasDiscount && (
          <Badge tone="danger" className="absolute start-2 top-2">
            Sale
          </Badge>
        )}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          className="bg-brand-paper/90 text-brand-mauve shadow-brand-tight hover:text-brand-plum absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full dark:bg-neutral-900/90 dark:text-neutral-300"
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isWishlisted && 'fill-brand-rose text-brand-rose',
            )}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="mt-3">
        <p className="text-brand-ink text-sm font-medium dark:text-neutral-100">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-danger-500 text-sm font-semibold">
                {formatCurrency(Number(product.discountPrice), {
                  currency: product.currency,
                })}
              </span>
              <span className="text-xs text-neutral-400 line-through dark:text-neutral-500">
                {formatCurrency(Number(product.price), {
                  currency: product.currency,
                })}
              </span>
            </>
          ) : (
            <span className="text-brand-ink text-sm font-semibold dark:text-neutral-100">
              {formatCurrency(Number(product.price), {
                currency: product.currency,
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
