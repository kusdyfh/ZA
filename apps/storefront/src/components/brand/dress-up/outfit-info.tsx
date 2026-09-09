import Link from 'next/link';
import { cn, formatCurrency } from '@za/shared';
import type { Color } from '@/features/colors/api';
import type { Product } from '@/features/products/types';

export interface OutfitInfoProps {
  product: Product;
  activeColor?: Color;
  className?: string;
}

/**
 * The commercial payload beneath the character stage: real product name,
 * price, and the selected colour, linking straight to the real PDP
 * (`/products/[slug]`) — clicking the outfit always opens the actual
 * product page, per the Character System spec's interaction rule that the
 * character never gates the purchase.
 */
export function OutfitInfo({
  product,
  activeColor,
  className,
}: OutfitInfoProps) {
  const price = formatCurrency(Number(product.price), {
    currency: product.currency,
  });

  return (
    <div className={cn('text-center', className)}>
      <p className="font-display text-brand-ink text-xl font-semibold">
        {product.name}
      </p>
      <p className="text-brand-ink-muted mt-1">
        {price}
        {activeColor && <> · {activeColor.name}</>}
      </p>
      <Link
        href={`/products/${product.slug}`}
        className="rounded-brand-pill bg-brand-blush-500 shadow-brand-soft hover:bg-brand-blush-600 hover:shadow-brand-glow mt-4 inline-block px-6 py-2.5 font-medium text-white transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        Shop this look
      </Link>
    </div>
  );
}
