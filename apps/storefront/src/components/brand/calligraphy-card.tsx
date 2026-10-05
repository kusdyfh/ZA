import Image from 'next/image';
import { cn } from '@za/shared';
import {
  DoodleUnderline,
  FloatingDecoration,
  Sparkle,
  TwinkleStar,
} from './decorative';

const SOURCE_WIDTH = 1290;
const SOURCE_HEIGHT = 555;

export interface CalligraphyCardProps {
  /** Transparent artwork; the card supplies the paper, so ink shows through. */
  src: string;
  /** The wording of the artwork, for screen readers and as the image alt. */
  text: string;
  /** Source-pixel region of the artwork to show (trims empty margins). */
  crop?: { x: number; y: number; width: number; height: number };
  /** Short hand-lettered label above the card. */
  eyebrow?: string;
  className?: string;
}

/**
 * A hand-lettered Arabic tagline set on a paper card (ADR 0029 §8 — the
 * dashed-frame signage motif). The artwork is transparent so the card's
 * own surface shows through; the dashed inner frame and the corner sparkles
 * keep it in the same family as the hero and the arch plaques.
 */
export function CalligraphyCard({
  src,
  text,
  eyebrow,
  crop = { x: 0, y: 0, width: SOURCE_WIDTH, height: SOURCE_HEIGHT },
  className,
}: CalligraphyCardProps) {
  return (
    <section
      className={cn('py-section-y mx-auto max-w-4xl px-4 sm:px-6', className)}
      aria-label={eyebrow ?? text}
    >
      {eyebrow && (
        <p className="font-script text-brand-berry mb-4 text-center text-2xl">
          {eyebrow}
        </p>
      )}
      <div className="bg-brand-paper rounded-brand-lg border-brand-petal-300/60 shadow-brand-soft relative border p-3 sm:p-4">
        <FloatingDecoration className="absolute -left-2 -top-3" speed="slow">
          <TwinkleStar className="text-brand-gold h-6 w-6" />
        </FloatingDecoration>
        <FloatingDecoration
          className="absolute -bottom-3 -right-2"
          delayMs={500}
        >
          <Sparkle className="text-brand-petal-300 h-6 w-6" />
        </FloatingDecoration>

        <div className="rounded-brand-md border-brand-petal-300 bg-brand-blush/40 flex flex-col items-center border border-dashed px-4 py-8 sm:px-10 sm:py-12">
          <div
            className="relative w-full max-w-[560px] overflow-hidden"
            style={{ aspectRatio: `${crop.width} / ${crop.height}` }}
          >
            <Image
              src={src}
              alt={text}
              width={SOURCE_WIDTH}
              height={SOURCE_HEIGHT}
              sizes="(min-width: 896px) 900px, 140vw"
              className="absolute max-w-none"
              style={{
                width: `${(SOURCE_WIDTH / crop.width) * 100}%`,
                left: `${(-crop.x / crop.width) * 100}%`,
                top: `${(-crop.y / crop.height) * 100}%`,
              }}
            />
          </div>
          <DoodleUnderline className="text-brand-petal-300 mt-2" />
        </div>
      </div>
    </section>
  );
}
