import { cn } from '@za/shared';
import { DoodleUnderline, FloatingDecoration, Sparkle, TwinkleStar } from './decorative';

export interface QuoteSectionProps {
  quote: string;
  attribution?: string;
  className?: string;
}

/** The "Brand Philosophy" quote block (ADR 0028 §6) — large script-font pull-quote with a soft decorative flourish. */
export function QuoteSection({ quote, attribution, className }: QuoteSectionProps) {
  return (
    <div className={cn('relative mx-auto max-w-2xl px-4 py-section-y text-center sm:px-6', className)}>
      <FloatingDecoration className="absolute left-[8%] top-2" speed="slow">
        <TwinkleStar className="h-5 w-5 text-brand-blush-300" />
      </FloatingDecoration>
      <FloatingDecoration className="absolute right-[10%] bottom-2" delayMs={500}>
        <Sparkle className="h-6 w-6 text-brand-butter-500" />
      </FloatingDecoration>
      <p className="font-script text-3xl leading-snug text-brand-ink sm:text-4xl">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex justify-center">
        <DoodleUnderline className="text-brand-blush-300" />
      </div>
      {attribution && <p className="mt-4 text-sm uppercase tracking-wide text-brand-ink-muted">{attribution}</p>}
    </div>
  );
}
