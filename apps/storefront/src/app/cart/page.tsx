'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button, EmptyState, Heading, QuantityStepper, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/features/cart/api';

export default function CartPage() {
  const router = useRouter();
  const cartToken = useCartToken();
  const { data: cart, isLoading } = useCartQuery(cartToken);
  const updateMutation = useUpdateCartItemMutation(cartToken);
  const removeMutation = useRemoveCartItemMutation(cartToken);

  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Heading level={2} as="h1" className="mb-6">
        Your cart
      </Heading>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the shop to find something you'll love."
          action={<Button onClick={() => router.push('/shop')}>Continue shopping</Button>}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex flex-col items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">{item.productName}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.sku}</p>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                    {formatCurrency(item.unitPrice, { currency: cart?.currencyCode })} each
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(quantity) => updateMutation.mutate({ variantId: item.variantId, quantity })}
                  />
                  <p className="w-24 text-end font-medium text-neutral-900 dark:text-neutral-50">
                    {formatCurrency(item.lineTotal, { currency: cart?.currencyCode })}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => removeMutation.mutate({ variantId: item.variantId })}
                    className="text-neutral-400 hover:text-danger-500"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {cart && (
            <div className="mt-6 flex flex-col items-end gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <div className="flex w-full max-w-xs justify-between text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal, { currency: cart.currencyCode })}</span>
              </div>
              <Button size="lg" onClick={() => router.push('/checkout')}>
                Proceed to checkout
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
