import { cn } from '@za/shared';

export interface LogoProps {
  /**
   * `primary` — the full lockup (Z+A, bow ribbon at the junction, the
   * stethoscope-to-heart mark near the A) for hero/signature moments.
   * `wordmark` — Z+A only, for the header/footer/anywhere height is tight.
   * `compact` — a circular monogram badge, for the mobile header and any
   * context under ~48px tall.
   */
  variant?: 'primary' | 'wordmark' | 'compact';
  /**
   * `auto` follows the site's light/dark toggle (for theme-aware chrome —
   * header, footer). `fixed-light` always renders the rose/plum combo
   * regardless of theme, for placements on ADR 0029 §11's fixed-light
   * surfaces (Hero, editorial headers). `on-rose` is the paper+plum combo
   * for placements on a Rose/Dusty-colored background.
   */
  tone?: 'auto' | 'fixed-light' | 'on-rose';
  className?: string;
}

const Z_TONE_CLASSES: Record<NonNullable<LogoProps['tone']>, string> = {
  auto: 'text-brand-rose dark:text-brand-petal-300',
  'fixed-light': 'text-brand-rose',
  'on-rose': 'text-brand-paper',
};

const A_TONE_CLASSES: Record<NonNullable<LogoProps['tone']>, string> = {
  auto: 'text-brand-plum dark:text-brand-paper',
  'fixed-light': 'text-brand-plum',
  'on-rose': 'text-brand-plum',
};

/**
 * The bow/ribbon mark (ADR 0029 §2) — sits at the Z/A junction on the
 * `primary` lockup only. Reserved for the logo, packaging, and section
 * dividers; never a UI control (ADR 0029 §8's red line).
 */
function BowMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden="true">
      <path
        d="M46 30 8 8c-4 12-4 24 0 36 15-5 30-12 38-14Z"
        fill="currentColor"
        opacity=".92"
      />
      <path
        d="M54 30 92 8c4 12 4 24 0 36-15-5-30-12-38-14Z"
        fill="currentColor"
      />
      <rect
        x="42"
        y="21"
        width="16"
        height="18"
        rx="4"
        fill="currentColor"
        opacity=".96"
      />
      <path
        d="M46 39c-3 6-4 12-2 18M54 39c3 6 4 12 2 18"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The stethoscope-that-becomes-a-heart mark (ADR 0029 §2/§6) — care read as
 * affection, not clinical equipment; the signature illustrated motif that
 * ties the logo to the rest of the decorative language.
 */
function StethoHeartMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M20 8v20c0 14 10 22 22 22s22-8 22-22V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M42 50v14c0 16 12 26 28 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="8" r="5" fill="currentColor" />
      <circle cx="42" cy="8" r="5" fill="currentColor" />
      <circle
        cx="76"
        cy="90"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}

/**
 * The ZA wordmark/lockup (ADR 0029 §2) — built entirely from real Fraunces
 * type (900 italic Z, 600 upright A), never a hand-drawn logotype, so it
 * renders identically on screen, in print, or embroidered. See ADR 0029 §2
 * for the full 10-variant system this implements a practical web subset of.
 */
export function Logo({
  variant = 'wordmark',
  tone = 'auto',
  className,
}: LogoProps) {
  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'bg-brand-petal-100 font-display inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold leading-none',
          className,
        )}
        aria-label="ZA"
      >
        <span className={Z_TONE_CLASSES[tone]}>Z</span>
        <span className={cn('-ms-0.5', A_TONE_CLASSES[tone])}>A</span>
      </span>
    );
  }

  if (variant === 'primary') {
    return (
      <span
        className={cn(
          'relative inline-flex items-center justify-center leading-[0.8]',
          className,
        )}
        aria-label="ZA"
      >
        <span
          className={cn(
            'font-display text-[clamp(4.5rem,16vw,9.5rem)] font-black italic tracking-tight',
            Z_TONE_CLASSES[tone],
          )}
        >
          Z
        </span>
        <span
          className={cn(
            'font-display ms-[-0.09em] text-[clamp(4.5rem,16vw,9.5rem)] font-semibold',
            A_TONE_CLASSES[tone],
          )}
        >
          A
        </span>
        <BowMark className="text-brand-rose absolute left-1/2 top-[58%] z-10 w-[22%] -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] drop-shadow-sm" />
        <StethoHeartMark className="text-brand-plum absolute right-[4%] top-[2%] w-[26%]" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'font-display inline-flex items-center text-2xl font-extrabold leading-none',
        className,
      )}
      aria-label="ZA"
    >
      <span className={Z_TONE_CLASSES[tone]}>Z</span>
      <span className={cn('-ms-[0.06em]', A_TONE_CLASSES[tone])}>A</span>
    </span>
  );
}
