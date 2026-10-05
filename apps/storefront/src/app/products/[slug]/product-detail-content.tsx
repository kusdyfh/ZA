'use client';

import { Coffee, GraduationCap, Moon } from 'lucide-react';
import { ErrorState, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useProductDetailQuery } from '@/features/products/api';
import { ProductGallery } from '@/features/products/components/product-gallery';
import { AddToCartForm } from '@/features/products/components/add-to-cart-form';
import {
  ArchPlaque,
  DoodleUnderline,
  FloatingDecoration,
  LifestyleSection,
  Sparkle,
} from '@/components/brand';

const PDP_LIFESTYLE_MOMENTS = [
  {
    title: 'Night Shift',
    caption: 'Soft, breathable, built to last',
    icon: Moon,
    tone: 'plum' as const,
    href: '/shop?isBestSeller=true',
  },
  {
    title: 'Study Session',
    caption: 'From lecture hall to lab bench',
    icon: GraduationCap,
    tone: 'rose' as const,
    href: '/shop?isNewArrival=true',
  },
  {
    title: 'Coffee Break',
    caption: 'Five quiet minutes between rounds',
    icon: Coffee,
    tone: 'gold' as const,
    href: '/shop?isFeatured=true',
  },
];

/**
 * ADR 0029 §? — simplified per explicit direction to a focused Visual →
 * Colors/Sizes/Add to Cart → Story/Illustration flow. Breadcrumbs, the
 * description/specifications accordion, related/cross-sell/up-sell rails,
 * and the review section are deliberately removed from this page (a real,
 * disclosed product decision — not a bug); their components and the
 * underlying API data are untouched and still used elsewhere, so this is
 * reversible without any backend/business-logic change.
 */
export function ProductDetailContent({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useProductDetailQuery(slug);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Product not found"
          description="It may have been removed or is no longer available."
        />
      </div>
    );
  }

  const { product, variants, media } = data;
  const hasDiscount =
    product.discountPrice !== null &&
    Number(product.discountPrice) < Number(product.price);

  return (
    <div>
      {/* ADR 0028 §7 — an illustrated header band, fixed light palette,
          self-contained above the functional (theme-aware) core below.
          Visual-only per the brief: no product data changes here. */}
      <div className="bg-brand-gradient-section relative overflow-hidden py-10 text-center">
        <FloatingDecoration className="absolute left-[10%] top-4" speed="slow">
          <Sparkle className="text-brand-petal-300 h-5 w-5" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute right-[12%] top-6"
          delayMs={500}
        >
          <Sparkle className="text-brand-gold h-4 w-4" />
        </FloatingDecoration>
        <ArchPlaque className="mx-auto">Made with care</ArchPlaque>
        <p className="text-brand-mauve mx-auto mt-4 max-w-md px-4 text-sm">
          Every piece is chosen for the way real shifts actually go — soft
          fabric, thoughtful pockets, room to move.
        </p>
        <div className="mt-2 flex justify-center">
          <DoodleUnderline className="text-brand-petal-300" />
        </div>
      </div>

      {/* Product Visual + Colors / Sizes / Add to Cart (AddToCartForm bundles
          the variant picker and submit action together — untouched). */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductGallery media={media} productName={product.name} />

          <div>
            <h1 className="font-display text-brand-ink text-3xl font-semibold dark:text-neutral-50">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-danger-500 text-xl font-semibold">
                    {formatCurrency(Number(product.discountPrice), {
                      currency: product.currency,
                    })}
                  </span>
                  <span className="text-base text-neutral-400 line-through dark:text-neutral-500">
                    {formatCurrency(Number(product.price), {
                      currency: product.currency,
                    })}
                  </span>
                </>
              ) : (
                <span className="text-brand-ink text-xl font-semibold dark:text-neutral-100">
                  {formatCurrency(Number(product.price), {
                    currency: product.currency,
                  })}
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p
                dir="auto"
                className="text-brand-mauve mt-4 dark:text-neutral-400"
              >
                {product.shortDescription}
              </p>
            )}

            <div className="mt-6">
              <AddToCartForm variants={variants} />
            </div>
          </div>
        </div>
      </div>

      {/* Story / Illustration — the product's narrative/lifestyle band. */}
      <div className="bg-brand-cream py-section-y mt-4">
        <div className="mb-8 text-center">
          <p className="font-script text-brand-berry text-2xl">
            Fits right into your day
          </p>
          <h2 className="font-display text-brand-ink text-2xl font-semibold sm:text-3xl">
            Story / Illustration
          </h2>
        </div>
        <LifestyleSection moments={PDP_LIFESTYLE_MOMENTS} />
      </div>
    </div>
  );
}
