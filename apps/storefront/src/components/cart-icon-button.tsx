'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useCartQuery } from '@/features/cart/api';

export function CartIconButton() {
  const cartToken = useCartToken();
  const { data: cart } = useCartQuery(cartToken);
  const { open } = useCartDrawer();
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}
