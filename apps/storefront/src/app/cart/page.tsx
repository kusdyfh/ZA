'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button, EmptyState, Heading, QuantityStepper, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useCartToken } from '@/lib/cart/use-cart-token';
import {
  useCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/features/cart/api';

export default function CartPage() {
  const router = useRouter();
  const cartToken = useCartToken();
  const { data: cart, isLoading } = useCartQuery(cartToken);
  const updateMutation = useUpdateCartItemMutation(cartToken);
  const removeMutation = useRemoveCartItemMutation(cartToken);

  const items = cart?.items ?? [];

  return (
    // Brand-token skin matching CartDrawer (same underlying data) — ADR
    // 0029 §11 theme-aware treatment: brand tokens for light mode, the
    // pre-existing neutral dark palette for dark mode.
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Heading
          level={2}
          as="h1"
          className="text-brand-ink mb-6 dark:text-neutral-50"
        >
          Your cart
        </Heading>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="bg-brand-blush h-24 w-full dark:bg-neutral-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Browse the shop to find something you'll love."
            action={
              <Button
                onClick={() => router.push('/shop')}
                className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
              >
                Continue shopping
              </Button>
            }
            className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
            iconClassName="text-brand-dusty dark:text-neutral-500"
          />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="rounded-brand-md border-brand-petal-100 bg-brand-paper flex flex-col items-start justify-between gap-4 border p-4 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex-1">
                    <p className="text-brand-ink font-medium dark:text-neutral-50">
                      {item.productName}
                    </p>
                    <p className="text-brand-mauve text-xs dark:text-neutral-400">
                      {item.sku}
                    </p>
                    <p className="text-brand-ink mt-1 text-sm dark:text-neutral-300">
                      {formatCurrency(item.unitPrice, {
                        currency: cart?.currencyCode,
                      })}{' '}
                      each
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(quantity) =>
                        updateMutation.mutate({
                          variantId: item.variantId,
                          quantity,
                        })
                      }
                    />
                    <p className="text-brand-ink w-24 text-end font-medium dark:text-neutral-50">
                      {formatCurrency(item.lineTotal, {
                        currency: cart?.currencyCode,
                      })}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove ${item.productName}`}
                      onClick={() =>
                        removeMutation.mutate({ variantId: item.variantId })
                      }
                      className="text-brand-dusty hover:text-danger-500"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {cart && (
              <div className="border-brand-petal-100 mt-6 flex flex-col items-end gap-4 border-t pt-6 dark:border-neutral-800">
                <div className="text-brand-ink flex w-full max-w-xs justify-between text-lg font-semibold dark:text-neutral-50">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(cart.subtotal, {
                      currency: cart.currencyCode,
                    })}
                  </span>
                </div>
                <Button
                  size="lg"
                  onClick={() => router.push('/checkout')}
                  className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
                >
                  Proceed to checkout
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
