import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PortraitBlob } from './portrait-blob';
import { IllustratedBackground } from './illustrated-background';
import { ArchPlaque } from './arch-plaque';
import { FloatingDecoration, Flower, TwinkleStar } from './decorative';

export interface BrandHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

/** The homepage hero moment (ADR 0028 §6) — illustrated gradient backdrop, signage-style eyebrow, and a pill CTA into the real shop. */
export function BrandHero({ eyebrow, title, subtitle, ctaLabel, ctaHref }: BrandHeroProps) {
  return (
    <IllustratedBackground tone="hero" className="py-section-y">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <ArchPlaque>{eyebrow}</ArchPlaque>
        <h1 className="font-display text-4xl font-semibold text-white drop-shadow-sm sm:text-6xl">{title}</h1>
        <p className="max-w-xl text-lg text-white/95">{subtitle}</p>
        <Link
          href={ctaHref}
          className="mt-2 inline-flex items-center gap-2 rounded-brand-pill bg-white px-8 py-3 font-semibold text-brand-blush-600 shadow-brand-glow transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {ctaLabel}
        </Link>

        <div className="relative mt-8 flex items-center justify-center">
          <FloatingDecoration className="absolute -left-16 top-2 hidden sm:block" speed="slow">
            <Flower className="h-8 w-8 text-white/70" />
          </FloatingDecoration>
          <FloatingDecoration className="absolute -right-16 bottom-0 hidden sm:block" delayMs={800}>
            <TwinkleStar className="h-6 w-6 text-white" />
          </FloatingDecoration>
          <PortraitBlob icon={Sparkles} tone="butter" className="h-40 w-40 shadow-brand-glow sm:h-52 sm:w-52" />
        </div>
      </div>
    </IllustratedBackground>
  );
}
