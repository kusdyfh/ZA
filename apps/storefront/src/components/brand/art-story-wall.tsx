import type { ComponentType, ReactNode, SVGProps } from 'react';
import { cn } from '@za/shared';
import type { Product } from '@/features/products/types';
import { ProductCard } from '@/features/products/components/product-card';
import { PortraitBlob } from './portrait-blob';
import { PaperTape } from './decorative';

export interface StoryFrame {
  type: 'story';
  eyebrow: string;
  title: string;
  narrative: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  products?: Product[];
  children?: ReactNode;
}

export interface QuoteFrame {
  type: 'quote';
  quote: string;
  attribution?: string;
}

export type WallFrame = StoryFrame | QuoteFrame;

const ROTATIONS = [-2, 1.5, -1, 2] as const;
const TAPE_TONES = ['rose', 'gold', 'lavender'] as const;

/**
 * "Art / Story Wall" — consolidates what were three separate homepage
 * sections (two `StorySection`s + the Brand Philosophy `QuoteSection`)
 * into one gallery-wall composition: framed panels at a slight hand-hung
 * tilt, each pinned with a `PaperTape` corner accent. Story frames keep
 * their real linked products; the quote frame is purely editorial.
 */
export function ArtStoryWall({
  frames,
  className,
}: {
  frames: WallFrame[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2',
        className,
      )}
    >
      {frames.map((frame, index) => {
        const rotate = ROTATIONS[index % ROTATIONS.length] ?? 0;
        const tapeTone = TAPE_TONES[index % TAPE_TONES.length] ?? 'rose';

        if (frame.type === 'quote') {
          return (
            <div
              key={`quote-${index}`}
              className="rounded-brand-lg bg-brand-paper shadow-brand-soft relative flex flex-col items-center justify-center p-8 text-center"
              style={{ transform: `rotate(${rotate}deg)` }}
            >
              <PaperTape
                tone={tapeTone}
                rotate={rotate * 3}
                className="-top-3 left-1/2 -translate-x-1/2"
              />
              <p className="font-script text-brand-ink text-3xl leading-snug sm:text-4xl">
                &ldquo;{frame.quote}&rdquo;
              </p>
              {frame.attribution && (
                <p className="text-brand-mauve mt-4 text-sm uppercase tracking-wide">
                  {frame.attribution}
                </p>
              )}
            </div>
          );
        }

        return (
          <div
            key={frame.title}
            className="rounded-brand-lg bg-brand-paper shadow-brand-soft relative flex flex-col gap-4 p-6"
            style={{ transform: `rotate(${rotate}deg)` }}
          >
            <PaperTape
              tone={tapeTone}
              rotate={rotate * 3}
              className="-top-3 left-1/2 -translate-x-1/2"
            />
            <div className="flex items-start gap-4">
              <PortraitBlob
                icon={frame.icon}
                tone={frame.tone ?? 'rose'}
                className="h-20 w-20 shrink-0"
              />
              <div>
                <p className="font-script text-brand-berry text-xl">
                  {frame.eyebrow}
                </p>
                <h3 className="font-display text-brand-ink text-xl font-semibold">
                  {frame.title}
                </h3>
              </div>
            </div>
            <p className="text-brand-mauve text-sm">{frame.narrative}</p>
            {frame.products && frame.products.length > 0 && (
              <div className="mt-1 grid grid-cols-3 gap-3">
                {frame.products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {frame.children}
          </div>
        );
      })}
    </div>
  );
}
