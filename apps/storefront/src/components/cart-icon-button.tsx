'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useCartQuery } from '@/features/cart/api';

export function CartIconButton() {
  const cartToken = useCartToken();
  const { data: cart } = useCartQuery(cartToken);
  const { open } = useCartDrawer();
  const itemCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}
      className="text-brand-plum hover:bg-brand-petal-100 focus-visible:shadow-focus relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none"
    >
      <ShoppingBag
        className="h-[22px] w-[22px]"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {itemCount > 0 && (
        <span className="bg-brand-berry text-brand-paper absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
          {itemCount}
        </span>
      )}
    </button>
  );
}
