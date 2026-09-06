'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@za/shared';
import type { ProductMedia } from '../types';

export function ProductGallery({ media, productName }: { media: ProductMedia[]; productName: string }) {
  const sorted = [...media].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0) || a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  if (sorted.length === 0) {
    return (
      <div className="aspect-square w-full rounded-lg bg-neutral-100 dark:bg-neutral-800" aria-hidden="true" />
    );
  }

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {active?.type === 'VIDEO' ? (
          <video src={active.url} className="h-full w-full object-cover" controls aria-label={active.altText ?? productName} />
        ) : (
          <Image
            src={active?.url ?? ''}
            alt={active?.altText ?? productName}
            width={800}
            height={800}
            priority
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {sorted.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {sorted.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${sorted.length}`}
              aria-current={index === activeIndex}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2',
                index === activeIndex ? 'border-pink-500' : 'border-transparent',
              )}
            >
              {item.type === 'VIDEO' ? (
                <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-xs dark:bg-neutral-700">Video</div>
              ) : (
                <Image src={item.url} alt="" fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
