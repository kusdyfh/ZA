'use client';

import { Coffee, GraduationCap, Moon } from 'lucide-react';
import { Accordion, Breadcrumbs, ErrorState, Skeleton } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useProductDetailQuery } from '@/features/products/api';
import { ProductGallery } from '@/features/products/components/product-gallery';
import { AddToCartForm } from '@/features/products/components/add-to-cart-form';
import { ProductRail } from '@/features/products/components/product-rail';
import { ReviewSection } from '@/features/reviews/components/review-section';
import { BreadcrumbLink } from '@/components/breadcrumb-link';
import { ArchPlaque, DoodleUnderline, FloatingDecoration, LifestyleSection, Sparkle } from '@/components/brand';

const PDP_LIFESTYLE_MOMENTS = [
  { title: 'Night Shift', caption: 'Soft, breathable, built to last', icon: Moon, tone: 'plum' as const, href: '/shop?isBestSeller=true' },
  { title: 'Study Session', caption: 'From lecture hall to lab bench', icon: GraduationCap, tone: 'sky' as const, href: '/shop?isNewArrival=true' },
  { title: 'Coffee Break', caption: 'Five quiet minutes between rounds', icon: Coffee, tone: 'butter' as const, href: '/shop?isFeatured=true' },
];

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
        <ErrorState title="Product not found" description="It may have been removed or is no longer available." />
      </div>
    );
  }

  const { product, variants, media, specifications, related, crossSell, upSell } = data;
  const hasDiscount = product.discountPrice !== null && Number(product.discountPrice) < Number(product.price);

  return (
    <div>
      {/* ADR 0028 §7 — an illustrated header band, fixed light palette,
          self-contained above the functional (theme-aware) core below.
          Visual-only per the brief: no product data changes here. */}
      <div className="relative overflow-hidden bg-brand-gradient-section py-10 text-center">
        <FloatingDecoration className="absolute left-[10%] top-4" speed="slow">
          <Sparkle className="h-5 w-5 text-brand-blush-300" />
        </FloatingDecoration>
        <FloatingDecoration className="absolute right-[12%] top-6" delayMs={500}>
          <Sparkle className="h-4 w-4 text-brand-butter-500" />
        </FloatingDecoration>
        <ArchPlaque className="mx-auto">Made with care</ArchPlaque>
        <p className="mx-auto mt-4 max-w-md px-4 text-sm text-brand-ink-muted">
          Every piece is chosen for the way real shifts actually go — soft fabric, thoughtful pockets, room to move.
        </p>
        <div className="mt-2 flex justify-center">
          <DoodleUnderline className="text-brand-blush-300" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          linkComponent={BreadcrumbLink}
          items={[{ label: 'Shop', href: '/shop' }, { label: product.name }]}
          className="mb-4"
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductGallery media={media} productName={product.name} />

        <div>
          <h1 className="font-display text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-semibold text-danger-500">
                  {formatCurrency(Number(product.discountPrice), { currency: product.currency })}
                </span>
                <span className="text-base text-neutral-400 line-through dark:text-neutral-500">
                  {formatCurrency(Number(product.price), { currency: product.currency })}
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(Number(product.price), { currency: product.currency })}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">{product.shortDescription}</p>
          )}

          <div className="mt-6">
            <AddToCartForm variants={variants} />
          </div>

          {(product.description || specifications.length > 0) && (
            <div className="mt-8">
              <Accordion
                allowMultiple
                defaultOpenKeys={['description']}
                items={[
                  ...(product.description
                    ? [{ key: 'description', title: 'Description', content: <p>{product.description}</p> }]
                    : []),
                  ...(specifications.length > 0
                    ? [
                        {
                          key: 'specifications',
                          title: 'Specifications',
                          content: (
                            <dl className="flex flex-col gap-2">
                              {specifications.map((spec) => (
                                <div key={spec.id} className="flex justify-between gap-4">
                                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">{spec.label}</dt>
                                  <dd className="text-end text-neutral-500 dark:text-neutral-400">{spec.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          )}
        </div>
        </div>
      </div>

      <ProductRail title="Related products" products={related} />
      <ProductRail title="Frequently bought together" products={crossSell} />
      <ProductRail title="You might also like" products={upSell} />

      <div className="mt-16 border-t border-neutral-200 pt-8 dark:border-neutral-800">
        <ReviewSection productId={product.id} />
      </div>

      {/* ADR 0028 §7 — "lifestyle recommendation" band from the brief, fixed
          light palette, self-contained below the functional core above. */}
      <div className="mt-16 bg-brand-cream-50 py-section-y">
        <div className="mb-8 text-center">
          <p className="font-script text-2xl text-brand-blush-600">Fits right into your day</p>
          <h2 className="font-display text-2xl font-semibold text-brand-ink sm:text-3xl">Made for the lifestyle</h2>
        </div>
        <LifestyleSection moments={PDP_LIFESTYLE_MOMENTS} />
      </div>
    </div>
  );
}
