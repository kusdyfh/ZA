'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button, Drawer, EmptyState, QuantityStepper, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useCartToken } from '@/lib/cart/use-cart-token';
import {
  useCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '../api';
import type { CartLineItem } from '../types';

export function CartDrawer() {
  const router = useRouter();
  const { isOpen, close } = useCartDrawer();
  const cartToken = useCartToken();
  const { data: cart, isLoading } = useCartQuery(cartToken);
  const updateMutation = useUpdateCartItemMutation(cartToken);
  const removeMutation = useRemoveCartItemMutation(cartToken);

  const items = cart?.items ?? [];

  function goTo(path: string) {
    close();
    router.push(path);
  }

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title="Your cart"
      side="end"
      className="bg-brand-cream dark:bg-neutral-900"
      titleClassName="text-brand-ink dark:text-neutral-50"
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="bg-brand-blush h-16 w-full dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the shop to find something you'll love."
          action={
            <Button
              onClick={() => goTo('/shop')}
              className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
            >
              Continue shopping
            </Button>
          }
          className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
          iconClassName="text-brand-dusty dark:text-neutral-500"
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item: CartLineItem) => (
            <li
              key={item.variantId}
              className="rounded-brand-md border-brand-petal-100 flex gap-3 border p-3 dark:border-neutral-800"
            >
              <div className="flex-1">
                <p className="text-brand-ink text-sm font-medium dark:text-neutral-50">
                  {item.productName}
                </p>
                <p className="text-brand-mauve text-xs dark:text-neutral-400">
                  {item.sku}
                </p>
                <p className="text-brand-ink mt-1 text-sm dark:text-neutral-300">
                  {formatCurrency(item.unitPrice, {
                    currency: cart?.currencyCode,
                  })}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(quantity) =>
                      updateMutation.mutate({
                        variantId: item.variantId,
                        quantity,
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() =>
                      removeMutation.mutate({ variantId: item.variantId })
                    }
                    className="text-brand-dusty hover:text-danger-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="text-brand-ink text-sm font-medium dark:text-neutral-50">
                {formatCurrency(item.lineTotal, {
                  currency: cart?.currencyCode,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && cart && (
        <div className="border-brand-petal-100 mt-6 flex flex-col gap-3 border-t pt-4 dark:border-neutral-800">
          <div className="text-brand-ink flex justify-between text-sm font-semibold dark:text-neutral-50">
            <span>Subtotal</span>
            <span>
              {formatCurrency(cart.subtotal, { currency: cart.currencyCode })}
            </span>
          </div>
          <Button
            onClick={() => goTo('/checkout')}
            className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
          >
            Checkout
          </Button>
          <Button
            variant="outline"
            onClick={() => goTo('/cart')}
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush"
          >
            View cart
          </Button>
        </div>
      )}
    </Drawer>
  );
}
