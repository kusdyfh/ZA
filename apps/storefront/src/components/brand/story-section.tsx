import type { ComponentType, ReactNode, SVGProps } from 'react';
import { cn } from '@za/shared';
import type { Product } from '@/features/products/types';
import { ProductCard } from '@/features/products/components/product-card';
import { PortraitBlob } from './portrait-blob';
import { DoodleUnderline, FloatingDecoration, Sparkle } from './decorative';

export interface StorySectionProps {
  eyebrow: string;
  title: string;
  narrative: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'blush' | 'butter' | 'sky' | 'plum';
  products?: Product[];
  reverse?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * A lifestyle "story block" (ADR 0028 §6, brief's "Story Sections") —
 * large illustration, short narrative, and real related products, replacing
 * a generic product grid with editorial storytelling. Products are passed
 * in as data (already fetched by the caller); this component never fetches.
 */
export function StorySection({
  eyebrow,
  title,
  narrative,
  icon,
  tone = 'blush',
  products = [],
  reverse = false,
  className,
  children,
}: StorySectionProps) {
  return (
    <div className={cn('mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2', className)}>
      <div className={cn('relative flex justify-center', reverse && 'md:order-2')}>
        <FloatingDecoration className="absolute -left-4 -top-4" speed="slow">
          <Sparkle className="h-6 w-6 text-brand-glow-strong" />
        </FloatingDecoration>
        <PortraitBlob icon={icon} tone={tone} className="h-64 w-64 sm:h-80 sm:w-80" />
        {children}
      </div>
      <div className={reverse ? 'md:order-1' : undefined}>
        <p className="font-script text-2xl text-brand-blush-600">{eyebrow}</p>
        <h3 className="mt-1 font-display text-3xl font-semibold text-brand-ink sm:text-4xl">{title}</h3>
        <DoodleUnderline className="mt-2 text-brand-blush-300" />
        <p className="mt-4 max-w-md text-brand-ink-muted">{narrative}</p>
        {products.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
