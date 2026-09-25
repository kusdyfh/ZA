import { cn } from '@za/shared';
import {
  DoodleUnderline,
  FloatingDecoration,
  Sparkle,
  TwinkleStar,
} from './decorative';

export interface QuoteSectionProps {
  quote: string;
  attribution?: string;
  className?: string;
}

/** The "Brand Philosophy" quote block (ADR 0028 §6) — large script-font pull-quote with a soft decorative flourish. */
export function QuoteSection({
  quote,
  attribution,
  className,
}: QuoteSectionProps) {
  return (
    <div
      className={cn(
        'py-section-y relative mx-auto max-w-2xl px-4 text-center sm:px-6',
        className,
      )}
    >
      <FloatingDecoration className="absolute left-[8%] top-2" speed="slow">
        <TwinkleStar className="text-brand-petal-300 h-5 w-5" />
      </FloatingDecoration>
      <FloatingDecoration
        className="absolute bottom-2 right-[10%]"
        delayMs={500}
      >
        <Sparkle className="text-brand-gold h-6 w-6" />
      </FloatingDecoration>
      <p className="font-script text-brand-ink text-3xl leading-snug sm:text-4xl">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 flex justify-center">
        <DoodleUnderline className="text-brand-petal-300" />
      </div>
      {attribution && (
        <p className="text-brand-mauve mt-4 text-sm uppercase tracking-wide">
          {attribution}
        </p>
      )}
    </div>
  );
}
