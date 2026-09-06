import { Heading } from '@za/ui';
import type { Product } from '../types';
import { ProductCard } from './product-card';

export function ProductRail({ title, products }: { title: string; products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <Heading level={3} as="h2" className="mb-4">
        {title}
      </Heading>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-40 shrink-0 sm:w-48" />
        ))}
      </div>
    </section>
  );
}
