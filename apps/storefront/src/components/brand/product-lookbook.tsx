'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { Heading } from '@za/ui';
import { cn, formatCurrency } from '@za/shared';
import type { Product } from '@/features/products/types';
import { Book } from './book';
import type { BookSheet } from './book';
import { Logo } from './logo';
import { PortraitBlob } from './portrait-blob';
import { DoodleUnderline, PaperTape, Sparkle, TwinkleStar } from './decorative';

export interface ProductLookbookProps {
  /** Up to three products; only the first three are shown. */
  products: Product[];
  className?: string;
}

const MAX_PRODUCTS = 3;
const PAGE_WIDTH = 260;
const PAGE_HEIGHT = 380;

const pad = (n: number) => String(n).padStart(2, '0');

/** Paper for a right-hand page (spine on its left) or a left-hand page (spine on its right). */
function Page({
  side,
  children,
  className,
}: {
  side: 'left' | 'right';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-brand-paper border-brand-petal-100 relative flex h-full w-full flex-col overflow-hidden border',
        side === 'right' ? 'rounded-r-brand-md' : 'rounded-l-brand-md',
        className,
      )}
    >
      {/* The curve of the paper towards the spine. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 w-8 from-black/[0.06] to-transparent',
          side === 'right'
            ? 'left-0 bg-gradient-to-r'
            : 'right-0 bg-gradient-to-l',
        )}
      />
      {children}
    </div>
  );
}

function CoverFace() {
  return (
    <div className="bg-brand-plum text-brand-paper relative h-full w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="border-brand-petal-300/60 rounded-brand-md pointer-events-none absolute inset-3 border border-dashed"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white/25 to-transparent"
      />
      <Sparkle className="text-brand-gold animate-brand-twinkle absolute right-8 top-8 h-5 w-5" />
      <TwinkleStar className="text-brand-petal-300 absolute left-9 top-24 h-4 w-4" />

      <div className="relative flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
        <div
          className="bg-brand-paper flex h-28 w-24 items-center justify-center shadow-md"
          style={{ borderRadius: '999px 999px 16px 16px' }}
        >
          <Logo variant="wordmark" className="h-16" />
        </div>
        <div>
          <p className="font-script text-brand-petal-100 text-4xl leading-none">
            The ZA Edit
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
            Lookbook
          </p>
        </div>
        <Sparkle className="text-brand-gold h-4 w-4" />
      </div>
    </div>
  );
}

function InsideCover() {
  return (
    <Page side="left" className="bg-brand-blush items-center justify-center">
      <Logo variant="wordmark" className="h-28" />
      <DoodleUnderline className="text-brand-petal-300 mt-4" />
      <p className="font-script text-brand-berry mt-3 text-2xl">
        for long shifts
      </p>
    </Page>
  );
}

function IntroPage({ count }: { count: number }) {
  return (
    <Page side="right" className="items-center justify-center px-7 text-center">
      <Sparkle className="text-brand-gold h-5 w-5" />
      <p className="font-script text-brand-berry mt-3 text-2xl">
        Meet the edit
      </p>
      <h3 className="font-display text-brand-ink mt-2 text-2xl font-semibold leading-tight">
        {count === 1 ? 'One piece' : `${count} pieces`}, one calm shift
      </h3>
      <DoodleUnderline className="text-brand-petal-300 mt-3" />
      <p className="text-brand-mauve mt-4 text-[15px] leading-relaxed">
        Chosen for the way real days go: soft fabric, thoughtful pockets, room
        to move.
      </p>
      <p className="font-script text-brand-plum mt-5 text-xl">
        Turn the page →
      </p>
    </Page>
  );
}

function PhotoPage({ product, index }: { product: Product; index: number }) {
  return (
    <Page side="left" className="p-5">
      <p className="font-display text-brand-plum text-sm font-semibold tracking-widest">
        NO. {pad(index + 1)}
      </p>
      <div className="relative mt-3 flex-1">
        <PaperTape
          tone="gold"
          rotate={-4}
          className="-top-3 left-1/2 z-10 -translate-x-1/2"
        />
        <div className="bg-brand-blush rounded-brand-md shadow-brand-tight relative h-full w-full overflow-hidden">
          {product.ogImageUrl ? (
            <Image
              src={product.ogImageUrl}
              alt={product.name}
              fill
              sizes="260px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PortraitBlob icon={Shirt} tone="rose" className="h-28 w-28" />
            </div>
          )}
        </div>
      </div>
      <p className="font-script text-brand-berry mt-3 text-center text-xl">
        Look {pad(index + 1)}
      </p>
    </Page>
  );
}

function DetailsPage({ product, index }: { product: Product; index: number }) {
  const hasDiscount =
    product.discountPrice !== null &&
    Number(product.discountPrice) < Number(product.price);
  const money = (amount: string) =>
    formatCurrency(Number(amount), { currency: product.currency });

  return (
    <Page side="right" className="p-6">
      <p className="font-display text-brand-petal-300 text-5xl font-semibold leading-none">
        {pad(index + 1)}
      </p>
      <h3 className="font-display text-brand-ink mt-3 text-xl font-semibold leading-tight">
        {product.name}
      </h3>
      <p className="mt-2 flex items-baseline gap-2">
        {hasDiscount ? (
          <>
            <span className="text-danger-500 text-lg font-semibold">
              {money(product.discountPrice!)}
            </span>
            <span className="text-brand-mauve text-sm line-through">
              {money(product.price)}
            </span>
          </>
        ) : (
          <span className="text-brand-plum text-lg font-semibold">
            {money(product.price)}
          </span>
        )}
      </p>
      {product.shortDescription && (
        <p
          dir="auto"
          className="text-brand-mauve mt-3 line-clamp-5 text-[15px] leading-relaxed"
        >
          {product.shortDescription}
        </p>
      )}
      <div className="mt-auto">
        <Link
          href={`/products/${product.slug}`}
          className="rounded-brand-pill bg-brand-plum text-brand-paper shadow-brand-tight hover:bg-brand-berry focus-visible:shadow-focus inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold outline-none"
        >
          Shop this piece
        </Link>
      </div>
    </Page>
  );
}

function ClosingNote() {
  return (
    <Page side="left" className="items-center justify-center px-7 text-center">
      <p className="font-script text-brand-ink text-3xl leading-snug">
        &ldquo;Clothes that show up for you the way you show up for everyone
        else.&rdquo;
      </p>
      <DoodleUnderline className="text-brand-petal-300 mt-4" />
      <p className="text-brand-mauve mt-3 text-xs uppercase tracking-wide">
        The ZA Store Philosophy
      </p>
    </Page>
  );
}

function EndPage({ onRestart }: { onRestart: () => void }) {
  return (
    <Page side="right" className="items-center justify-center px-7 text-center">
      <TwinkleStar className="text-brand-gold h-6 w-6" />
      <p className="font-script text-brand-berry mt-3 text-3xl">
        That&rsquo;s the edit
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href="/shop"
          className="rounded-brand-pill bg-brand-plum text-brand-paper shadow-brand-tight hover:bg-brand-berry focus-visible:shadow-focus inline-flex items-center px-6 py-2.5 text-sm font-semibold outline-none"
        >
          Shop all
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="text-brand-plum hover:bg-brand-blush focus-visible:shadow-focus rounded-brand-pill px-4 py-1.5 text-sm font-semibold outline-none"
        >
          Read again
        </button>
      </div>
    </Page>
  );
}

/**
 * "The ZA Edit": three products shown as a page-turning lookbook (the `Book`
 * effect). Each product gets a spread: its photo on the left, its details and a
 * link to its page on the right; a cover, an intro page and a closing note
 * frame them. Renders nothing without products.
 */
export function ProductLookbook({ products, className }: ProductLookbookProps) {
  const shown = products.slice(0, MAX_PRODUCTS);
  if (shown.length === 0) return null;

  // sheets[i].back and sheets[i + 1].front form a spread, so a product's photo
  // is the back of one sheet and its details the front of the next.
  const sheets: BookSheet[] = [
    {
      front: <IntroPage count={shown.length} />,
      back: <PhotoPage product={shown[0]!} index={0} />,
    },
    ...shown.map((product, index): BookSheet => ({
      front: <DetailsPage product={product} index={index} />,
      back: shown[index + 1] ? (
        <PhotoPage product={shown[index + 1]!} index={index + 1} />
      ) : (
        <ClosingNote />
      ),
    })),
  ];

  return (
    <section
      className={cn('bg-brand-blush py-section-y overflow-hidden', className)}
    >
      <div className="mb-10 text-center">
        <p className="font-script text-brand-berry text-2xl">Turn the page</p>
        <Heading
          level={2}
          as="h2"
          className="text-brand-ink dark:text-brand-ink"
        >
          The ZA Edit
        </Heading>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Book
          label="The ZA Edit lookbook"
          pageWidth={PAGE_WIDTH}
          pageHeight={PAGE_HEIGHT}
          cover={<CoverFace />}
          insideCover={<InsideCover />}
          sheets={sheets}
          endPage={({ restart }) => <EndPage onRestart={restart} />}
        />
      </div>
    </section>
  );
}
