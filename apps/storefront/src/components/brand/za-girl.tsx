import { useId } from 'react';
import { cn } from '@za/shared';

export interface ZaGirlProps {
  /** Dress tone — same rose/plum/gold/lavender family as every other brand component. */
  tone?: 'rose' | 'plum' | 'gold' | 'lavender';
  className?: string;
}

const DRESS_TONE_CLASSES: Record<NonNullable<ZaGirlProps['tone']>, string> = {
  rose: 'text-brand-rose',
  plum: 'text-brand-plum',
  gold: 'text-brand-dusty',
  lavender: 'text-brand-lavender',
};

const STETHO_TONE_CLASSES: Record<NonNullable<ZaGirlProps['tone']>, string> = {
  rose: 'stroke-brand-berry',
  plum: 'stroke-brand-plum',
  gold: 'stroke-brand-berry',
  lavender: 'stroke-brand-plum',
};

/**
 * The first ZA Girl — designed in Figma (see docs/v2/adr/0029, the "ZA Pink
 * Cartoon World" pass) rather than hand-guessed as raw SVG path data: the
 * hair silhouette is a real boolean union of three ellipses exported
 * directly from Figma, which is why it reads as an actual head of hair
 * instead of the angular, asymmetric shapes earlier hand-typed bezier
 * attempts kept producing. An editorial fashion-croquis figure (confident
 * flat shapes, minimal features) rather than a cartoon-cute face, with an
 * open lab-coat collar and stethoscope as the clearest medical-identity
 * cues alongside her dress. Only the `plum` tone has a Figma-verified
 * gradient on the dress (plum → berry, both real existing tokens); the
 * other tones fall back to a flat `currentColor` fill rather than
 * hand-guessing gradient pairs that were never visually verified.
 */
export function ZaGirl({ tone = 'plum', className }: ZaGirlProps) {
  const dressToneClass = DRESS_TONE_CLASSES[tone];
  const stethoToneClass = STETHO_TONE_CLASSES[tone];
  const reactId = useId();
  const gradientId =
    tone === 'plum' ? `za-girl-dress-gradient-${reactId}` : null;

  return (
    <svg
      viewBox="0 0 480 640"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
    >
      {gradientId && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="150.9"
            y1="473.8"
            x2="352.5"
            y2="430.6"
            gradientUnits="userSpaceOnUse"
          >
            {/* literal hex, matching brand-plum/brand-berry exactly — an
                SVG <stop> can't reliably resolve a Tailwind theme() lookup */}
            <stop stopColor="#7B4D6D" />
            <stop offset="1" stopColor="#704060" />
          </linearGradient>
        </defs>
      )}

      {/* hair-back — a boolean union of three ellipses (dome + two side waves), not a hand-typed path */}
      <path
        d="M240 70C281.421 70 315 108.056 315 155C315 162.011 314.25 168.823 312.838 175.34C323.112 194.506 330 229.725 330 270C330 330.751 314.33 380 295 380C275.67 380 260 330.751 260 270C260 258.281 260.585 246.99 261.665 236.398C254.806 238.74 247.533 240 240 240C232.467 240 225.193 238.74 218.334 236.398C219.414 246.99 220 258.281 220 270C220 330.751 204.33 380 185 380C165.67 380 150 330.751 150 270C150 229.726 156.887 194.506 167.161 175.34C165.749 168.823 165 162.011 165 155C165 108.056 198.579 70 240 70Z"
        className="fill-brand-berry"
      />

      {/* legs, neck, face */}
      <ellipse cx="240" cy="565" rx="35" ry="45" className="fill-brand-blush" />
      <rect
        x="222"
        y="208"
        width="36"
        height="40"
        rx="14"
        className="fill-brand-blush"
      />
      <ellipse cx="240" cy="156" rx="58" ry="66" className="fill-brand-blush" />

      {/* dress — Figma-verified gradient for plum, flat currentColor for the other tones */}
      <path
        d="M240 250C220 250 205 262 198 280L168 470C160 500 178 545 240 545C302 545 320 500 312 470L282 280C275 262 260 250 240 250Z"
        fill={gradientId ? `url(#${gradientId})` : 'currentColor'}
        className={gradientId ? undefined : dressToneClass}
      />

      {/* eyes */}
      <ellipse
        cx="219.5"
        cy="152.5"
        rx="3.5"
        ry="4.5"
        className="fill-brand-ink/80"
      />
      <ellipse
        cx="260.5"
        cy="152.5"
        rx="3.5"
        ry="4.5"
        className="fill-brand-ink/80"
      />
      {/* eyebrows */}
      <path
        d="M210 132c6-6 16-6 22-2"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="stroke-brand-berry/70"
      />
      <path
        d="M270 132c-6-6-16-6-22-2"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="stroke-brand-berry/70"
      />
      {/* smile */}
      <path
        d="M222 172c8 8 28 8 36 0"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="stroke-brand-berry/60"
      />
      {/* blush */}
      <ellipse cx="204" cy="168" rx="8" ry="6" className="fill-brand-rose/35" />
      <ellipse cx="276" cy="168" rx="8" ry="6" className="fill-brand-rose/35" />

      {/* open lab-coat collar over the dress */}
      <path
        d="M222 258c-14 10-24 26-28 44l16 48 26-82-14-10Z"
        className="fill-brand-paper"
      />
      <path
        d="M258 258c14 10 24 26 28 44l-16 48-26-82 14-10Z"
        className="fill-brand-paper"
      />

      {/* stethoscope */}
      <path
        d="M214 258c0 20 12 34 26 34s26-14 26-34"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        className={stethoToneClass}
      />
      <path
        d="M240 292v28"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        className={stethoToneClass}
      />
      <circle
        cx="240"
        cy="328"
        r="8"
        className={cn('fill-current', dressToneClass)}
      />
    </svg>
  );
}
