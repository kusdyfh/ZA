'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  BookOpen,
  Building2,
  Coffee,
  GraduationCap,
  Moon,
  Stethoscope,
} from 'lucide-react';
import { Heading, Skeleton } from '@za/ui';
import { cn } from '@za/shared';
import {
  useBestSellersQuery,
  useFeaturedProductsQuery,
  useNewArrivalsQuery,
} from '@/features/products/api';
import { ProductGrid } from '@/features/products/components/product-grid';
import type { Product } from '@/features/products/types';
import {
  ArtStoryWall,
  BrandHero,
  CharacterCarousel,
  DressShowcase,
  LifestyleSection,
  NewsletterSection,
  RotatingArtwork,
  Sparkle,
  Sticker,
} from '@/components/brand';
import type { WallFrame } from '@/components/brand';

// Deliberately lazy — a below-the-fold, non-critical trust section
// (per this epic's "lazy-load non-critical sections" requirement). No
// SSR needed: it carries no unique data and nothing here matters for
// crawlers, unlike the curated product shelves above it.
const TrustBadges = dynamic(
  () => import('@/components/trust-badges').then((mod) => mod.TrustBadges),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto h-24 w-full max-w-4xl" />,
  },
);

// ADR 0029 §4 — rose/plum are the ~30% mid-tier family, used freely; gold
// and lavender are ≤10% rare accents, at most one per composition, never
// both together. Each array below is its own composition.
const CHARACTERS = [
  {
    name: 'Medical Student',
    tagline: 'Notes, coffee, and a lucky pen',
    icon: GraduationCap,
    tone: 'rose' as const,
    href: '/shop',
  },
  {
    name: 'Doctor',
    tagline: 'Ready for rounds, ready for anything',
    icon: Stethoscope,
    tone: 'plum' as const,
    href: '/shop?isFeatured=true',
  },
  {
    name: 'Intern',
    tagline: 'First week jitters, first real scrubs',
    icon: BookOpen,
    tone: 'rose' as const,
    href: '/shop?isNewArrival=true',
  },
  {
    name: 'Night Shift',
    tagline: 'Soft fabric for the long haul',
    icon: Moon,
    tone: 'plum' as const,
    href: '/shop?isBestSeller=true',
  },
  {
    name: 'University Life',
    tagline: 'Lecture halls to clinical rounds',
    icon: Building2,
    tone: 'rose' as const,
    href: '/shop',
  },
  {
    name: 'Coffee Break',
    tagline: 'Five minutes, extra oat milk',
    icon: Coffee,
    tone: 'gold' as const,
    href: '/shop?isFeatured=true',
  },
];

// Static class map — Tailwind's JIT scanner can't detect dynamically
// interpolated `bg-brand-${tone}-100`-style class names, so every tone
// combination must appear as a literal string somewhere in source.
const INSTAGRAM_TILE_TONES = ['rose', 'plum', 'gold', 'plum'] as const;
const INSTAGRAM_TILE_CLASSES: Record<
  'rose' | 'plum' | 'gold' | 'lavender',
  { bg: string; icon: string }
> = {
  rose: { bg: 'bg-brand-petal-100', icon: 'text-brand-berry' },
  plum: { bg: 'bg-brand-plum-tint', icon: 'text-brand-plum' },
  gold: { bg: 'bg-brand-gold-tint', icon: 'text-brand-berry' },
  lavender: { bg: 'bg-brand-lavender-tint', icon: 'text-brand-plum' },
};

const LIFESTYLE_MOMENTS = [
  {
    title: 'Coffee Break',
    caption: 'Five quiet minutes between rounds',
    icon: Coffee,
    tone: 'rose' as const,
    href: '/shop?isFeatured=true',
  },
  {
    title: 'Night Shift',
    caption: 'Soft, breathable, built to last',
    icon: Moon,
    tone: 'plum' as const,
    href: '/shop?isBestSeller=true',
  },
  {
    title: 'Study Session',
    caption: 'From lecture hall to lab bench',
    icon: BookOpen,
    tone: 'rose' as const,
    href: '/shop?isNewArrival=true',
  },
  {
    title: 'University Life',
    caption: 'Where the journey begins',
    icon: GraduationCap,
    tone: 'plum' as const,
    href: '/shop',
  },
];

/** De-dupes across the three curated lists and caps at 10 — the "10 Products Showcase" pool. */
function pickTenProducts(...lists: (Product[] | undefined)[]): Product[] {
  const seen = new Set<string>();
  const picked: Product[] = [];
  for (const list of lists) {
    for (const product of list ?? []) {
      if (seen.has(product.id) || picked.length >= 10) continue;
      seen.add(product.id);
      picked.push(product);
    }
  }
  return picked;
}

export function HomeContent() {
  const featured = useFeaturedProductsQuery();
  const bestSellers = useBestSellersQuery();
  const newArrivals = useNewArrivalsQuery();

  const dressShowcaseSlides = [
    {
      id: 'featured',
      label: 'Featured Looks',
      icon: Stethoscope,
      tone: 'rose' as const,
      products: featured.data ?? [],
    },
    {
      id: 'best-sellers',
      label: 'Fan Favorites',
      icon: GraduationCap,
      tone: 'plum' as const,
      products: bestSellers.data ?? [],
    },
    {
      id: 'new-arrivals',
      label: 'Fresh Arrivals',
      icon: Moon,
      tone: 'lavender' as const,
      products: newArrivals.data ?? [],
    },
  ];

  const wallFrames: WallFrame[] = [
    {
      type: 'story',
      eyebrow: 'Featured Collection',
      title: "Pieces we can't stop wearing",
      narrative:
        "Soft fabrics, thoughtful pockets, and details that hold up through the longest shifts — this season's edit, chosen for the way real days actually go.",
      icon: Sparkle,
      tone: 'rose',
      products: featured.data,
    },
    {
      type: 'quote',
      quote:
        'Clothes that show up for you the way you show up for everyone else.',
      attribution: 'The ZA Store Philosophy',
    },
    {
      type: 'story',
      eyebrow: 'Our Story',
      title: 'From late nights to long shifts',
      narrative:
        'ZA Store started with a simple idea: the people who take care of everyone else deserve clothes that take care of them.',
      icon: Moon,
      tone: 'plum',
      products: bestSellers.data,
      children: (
        <Sticker tone="plum" className="absolute -bottom-3 right-4">
          Est. for long shifts
        </Sticker>
      ),
    },
  ];

  const tenProducts = pickTenProducts(
    featured.data,
    bestSellers.data,
    newArrivals.data,
  );
  const isTenProductsLoading =
    featured.isLoading || bestSellers.isLoading || newArrivals.isLoading;

  return (
    // ADR 0029 §11 — the whole homepage renders on a fixed light brand
    // surface regardless of the site's dark-mode toggle (a section with no
    // explicit background silently inherits the dark `body` background and
    // renders `brand-ink` text as functionally invisible against it — a
    // real bug caught via live visual verification while building this).
    <div className="bg-brand-cream text-brand-ink">
      <BrandHero
        title="Medical wear, dressed like fashion."
        subtitle="Premium scrubs and lab coats made for long shifts, designed to feel like yours."
        ctaLabel="Shop now"
        ctaHref="/shop"
        product={featured.data?.[0]}
      />

      {/* Character Showcase */}
      <section className="py-section-y mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-script text-brand-berry text-2xl">
            Who are you today?
          </p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Character Showcase
          </Heading>
        </div>
        <CharacterCarousel characters={CHARACTERS} />
      </section>

      {/* Art / Story Wall — consolidates the Featured Collection story, the
          Our Story narrative, and the Brand Philosophy quote into one
          gallery-wall composition. */}
      <section className="py-section-y">
        <div className="mb-10 text-center">
          <p className="font-script text-brand-berry text-2xl">
            Framed for you
          </p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Art / Story Wall
          </Heading>
        </div>
        <ArtStoryWall frames={wallFrames} />
      </section>

      {/* 10 Products Showcase — one curated grid pooling Featured/Best
          Sellers/New Arrivals, replacing the three separate shelves. */}
      <section className="py-section-y mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-script text-brand-berry text-xl">
              Handpicked, just for you
            </p>
            <Heading
              level={3}
              as="h2"
              className="text-brand-ink dark:text-brand-ink"
            >
              10 Products Showcase
            </Heading>
          </div>
          <Link
            href="/shop"
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-brand-paper border px-4 py-1.5 text-sm font-semibold"
          >
            View all
          </Link>
        </div>
        <ProductGrid
          products={tenProducts}
          isLoading={isTenProductsLoading}
          skeletonCount={10}
        />
      </section>

      {/* Doll Dress-Up */}
      <section className="bg-brand-blush py-section-y">
        <div className="mb-10 text-center">
          <p className="font-script text-brand-berry text-2xl">Try it on</p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Doll Dress-Up
          </Heading>
        </div>
        <DressShowcase slides={dressShowcaseSlides} />
      </section>

      {/* Medical Lifestyle */}
      <section className="py-section-y">
        <div className="mb-8 text-center">
          <p className="font-script text-brand-berry text-2xl">
            A day in the life
          </p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Medical Lifestyle
          </Heading>
        </div>
        <LifestyleSection moments={LIFESTYLE_MOMENTS} />
      </section>

      {/* Rotating Artwork — a purely decorative, auto-advancing carousel. */}
      <section className="py-section-y">
        <div className="mb-8 text-center">
          <p className="font-script text-brand-berry text-2xl">
            A little something extra
          </p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Rotating Artwork
          </Heading>
        </div>
        <RotatingArtwork />
      </section>

      {/* Instagram — a decorative placeholder grid; no live feed integration this epic. */}
      <section className="py-section-y mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-script text-brand-berry text-2xl">@zastore</p>
          <Heading
            level={2}
            as="h2"
            className="text-brand-ink dark:text-brand-ink"
          >
            Follow along
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INSTAGRAM_TILE_TONES.map((tone, index) => (
            <div
              key={`${tone}-${index}`}
              className={cn(
                'rounded-brand-md flex aspect-square items-center justify-center',
                INSTAGRAM_TILE_CLASSES[tone].bg,
              )}
            >
              <Sparkle
                className={cn('h-8 w-8', INSTAGRAM_TILE_CLASSES[tone].icon)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="pb-section-y px-4 sm:px-6">
        <NewsletterSection />
      </div>

      <TrustBadges />
    </div>
  );
}
