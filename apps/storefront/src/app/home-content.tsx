'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, Building2, Coffee, GraduationCap, Moon, Stethoscope } from 'lucide-react';
import { Heading, Skeleton } from '@za/ui';
import { cn } from '@za/shared';
import { useBestSellersQuery, useFeaturedProductsQuery, useNewArrivalsQuery } from '@/features/products/api';
import { ProductGrid } from '@/features/products/components/product-grid';
import type { Product } from '@/features/products/types';
import {
  BrandHero,
  CharacterCarousel,
  DressShowcase,
  IllustratedBackground,
  LifestyleSection,
  NewsletterSection,
  QuoteSection,
  StorySection,
  Sparkle,
  Sticker,
} from '@/components/brand';

// Deliberately lazy — a below-the-fold, non-critical trust section
// (per this epic's "lazy-load non-critical sections" requirement). No
// SSR needed: it carries no unique data and nothing here matters for
// crawlers, unlike the curated product shelves above it.
const TrustBadges = dynamic(() => import('@/components/trust-badges').then((mod) => mod.TrustBadges), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto h-24 w-full max-w-4xl" />,
});

function ProductShelf({
  eyebrow,
  title,
  href,
  isLoading,
  products,
}: {
  eyebrow: string;
  title: string;
  href: string;
  isLoading: boolean;
  products: Product[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-section-y sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-script text-xl text-brand-blush-600">{eyebrow}</p>
          <Heading level={3} as="h2" className="text-brand-ink dark:text-brand-ink">
            {title}
          </Heading>
        </div>
        <Link
          href={href}
          className="rounded-brand-pill border border-brand-blush-300 px-4 py-1.5 text-sm font-medium text-brand-blush-700 hover:bg-brand-blush-50"
        >
          View all
        </Link>
      </div>
      <ProductGrid products={products} isLoading={isLoading} skeletonCount={4} />
    </section>
  );
}

const CHARACTERS = [
  { name: 'Medical Student', tagline: 'Notes, coffee, and a lucky pen', icon: GraduationCap, tone: 'sky' as const, href: '/shop' },
  { name: 'Doctor', tagline: 'Ready for rounds, ready for anything', icon: Stethoscope, tone: 'blush' as const, href: '/shop?isFeatured=true' },
  { name: 'Intern', tagline: 'First week jitters, first real scrubs', icon: BookOpen, tone: 'butter' as const, href: '/shop?isNewArrival=true' },
  { name: 'Night Shift', tagline: 'Soft fabric for the long haul', icon: Moon, tone: 'plum' as const, href: '/shop?isBestSeller=true' },
  { name: 'University Life', tagline: 'Lecture halls to clinical rounds', icon: Building2, tone: 'sky' as const, href: '/shop' },
  { name: 'Coffee Break', tagline: 'Five minutes, extra oat milk', icon: Coffee, tone: 'butter' as const, href: '/shop?isFeatured=true' },
];

// Static class map — Tailwind's JIT scanner can't detect dynamically
// interpolated `bg-brand-${tone}-100`-style class names, so every tone
// combination must appear as a literal string somewhere in source.
const INSTAGRAM_TILE_TONES = ['blush', 'butter', 'sky', 'plum'] as const;
const INSTAGRAM_TILE_CLASSES: Record<(typeof INSTAGRAM_TILE_TONES)[number], { bg: string; icon: string }> = {
  blush: { bg: 'bg-brand-blush-100', icon: 'text-brand-blush-500' },
  butter: { bg: 'bg-brand-butter-100', icon: 'text-brand-butter-700' },
  sky: { bg: 'bg-brand-sky-100', icon: 'text-brand-sky-700' },
  plum: { bg: 'bg-brand-plum-100', icon: 'text-brand-plum-700' },
};

const LIFESTYLE_MOMENTS = [
  { title: 'Coffee Break', caption: 'Five quiet minutes between rounds', icon: Coffee, tone: 'butter' as const, href: '/shop?isFeatured=true' },
  { title: 'Night Shift', caption: 'Soft, breathable, built to last', icon: Moon, tone: 'plum' as const, href: '/shop?isBestSeller=true' },
  { title: 'Study Session', caption: 'From lecture hall to lab bench', icon: BookOpen, tone: 'sky' as const, href: '/shop?isNewArrival=true' },
  { title: 'University Life', caption: 'Where the journey begins', icon: GraduationCap, tone: 'blush' as const, href: '/shop' },
];

export function HomeContent() {
  const featured = useFeaturedProductsQuery();
  const bestSellers = useBestSellersQuery();
  const newArrivals = useNewArrivalsQuery();

  const dressShowcaseSlides = [
    { id: 'featured', label: 'Featured Looks', icon: Stethoscope, tone: 'blush' as const, products: featured.data ?? [] },
    { id: 'best-sellers', label: 'Fan Favorites', icon: GraduationCap, tone: 'butter' as const, products: bestSellers.data ?? [] },
    { id: 'new-arrivals', label: 'Fresh Arrivals', icon: Moon, tone: 'sky' as const, products: newArrivals.data ?? [] },
  ];

  return (
    // ADR 0028 §7 — the whole homepage renders on a fixed light brand
    // surface regardless of the site's dark-mode toggle (a section with no
    // explicit background silently inherits the dark `body` background and
    // renders `brand-ink` text as functionally invisible against it — a
    // real bug caught via live visual verification while building this).
    <div className="bg-brand-cream-50 text-brand-ink">
      <BrandHero
        eyebrow="ZA Store"
        title="Soft, modern medical wear"
        subtitle="Premium scrubs, lab coats, and accessories — made for long shifts, designed to feel like yours."
        ctaLabel="Shop now"
        ctaHref="/shop"
      />

      {/* Character Showcase */}
      <section className="mx-auto max-w-6xl px-4 py-section-y sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-script text-2xl text-brand-blush-600">Who are you today?</p>
          <Heading level={2} as="h2" className="text-brand-ink dark:text-brand-ink">
            Character Showcase
          </Heading>
        </div>
        <CharacterCarousel characters={CHARACTERS} />
      </section>

      {/* Featured Collection, told as a story */}
      <StorySection
        eyebrow="Featured Collection"
        title="Pieces we can't stop wearing"
        narrative="Soft fabrics, thoughtful pockets, and details that hold up through the longest shifts — this season's edit, chosen for the way real days actually go."
        icon={Sparkle}
        tone="blush"
        products={featured.data}
        className="py-section-y"
      />

      {/* Dress Showcase */}
      <section className="bg-brand-cream-100 py-section-y">
        <div className="mb-10 text-center">
          <p className="font-script text-2xl text-brand-blush-600">Try it on</p>
          <Heading level={2} as="h2" className="text-brand-ink dark:text-brand-ink">
            Dress Showcase
          </Heading>
        </div>
        <DressShowcase slides={dressShowcaseSlides} />
      </section>

      {/* Illustrated Story */}
      <StorySection
        eyebrow="Our Story"
        title="From late nights to long shifts"
        narrative="ZA Store started with a simple idea: the people who take care of everyone else deserve clothes that take care of them. Every piece is designed for real days, real shifts, and real life in between."
        icon={Moon}
        tone="plum"
        reverse
        products={bestSellers.data}
        className="py-section-y"
      >
        <Sticker tone="plum" className="absolute -bottom-3 right-4">
          Est. for long shifts
        </Sticker>
      </StorySection>

      <ProductShelf
        eyebrow="Handpicked"
        title="Featured Products"
        href="/shop?isFeatured=true"
        isLoading={featured.isLoading}
        products={featured.data ?? []}
      />
      <ProductShelf
        eyebrow="Loved by many"
        title="Best Sellers"
        href="/shop?isBestSeller=true"
        isLoading={bestSellers.isLoading}
        products={bestSellers.data ?? []}
      />

      {/* Medical Lifestyle */}
      <section className="py-section-y">
        <div className="mb-8 text-center">
          <p className="font-script text-2xl text-brand-blush-600">A day in the life</p>
          <Heading level={2} as="h2" className="text-brand-ink dark:text-brand-ink">
            Medical Lifestyle
          </Heading>
        </div>
        <LifestyleSection moments={LIFESTYLE_MOMENTS} />
      </section>

      <ProductShelf
        eyebrow="Just in"
        title="New Arrivals"
        href="/shop?isNewArrival=true"
        isLoading={newArrivals.isLoading}
        products={newArrivals.data ?? []}
      />

      {/* Brand Philosophy */}
      <IllustratedBackground tone="section">
        <QuoteSection
          quote="Clothes that show up for you the way you show up for everyone else."
          attribution="The ZA Store Philosophy"
        />
      </IllustratedBackground>

      {/* Instagram — a decorative placeholder grid; no live feed integration this epic. */}
      <section className="mx-auto max-w-6xl px-4 py-section-y sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-script text-2xl text-brand-blush-600">@zastore</p>
          <Heading level={2} as="h2" className="text-brand-ink dark:text-brand-ink">
            Follow along
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INSTAGRAM_TILE_TONES.map((tone) => (
            <div key={tone} className={cn('flex aspect-square items-center justify-center rounded-brand-md', INSTAGRAM_TILE_CLASSES[tone].bg)}>
              <Sparkle className={cn('h-8 w-8', INSTAGRAM_TILE_CLASSES[tone].icon)} />
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 pb-section-y sm:px-6">
        <NewsletterSection />
      </div>

      <TrustBadges />
    </div>
  );
}
