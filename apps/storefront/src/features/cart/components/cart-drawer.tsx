'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button, Drawer, EmptyState, QuantityStepper, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../api';
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
    <Drawer open={isOpen} onClose={close} title="Your cart" side="end">
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the shop to find something you'll love."
          action={<Button onClick={() => goTo('/shop')}>Continue shopping</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item: CartLineItem) => (
            <li key={item.variantId} className="flex gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{item.productName}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.sku}</p>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {formatCurrency(item.unitPrice, { currency: cart?.currencyCode })}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(quantity) => updateMutation.mutate({ variantId: item.variantId, quantity })}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => removeMutation.mutate({ variantId: item.variantId })}
                    className="text-neutral-400 hover:text-danger-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {formatCurrency(item.lineTotal, { currency: cart?.currencyCode })}
              </p>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && cart && (
        <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <div className="flex justify-between text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal, { currency: cart.currencyCode })}</span>
          </div>
          <Button onClick={() => goTo('/checkout')}>Checkout</Button>
          <Button variant="outline" onClick={() => goTo('/cart')}>
            View cart
          </Button>
        </div>
      )}
    </Drawer>
  );
}
