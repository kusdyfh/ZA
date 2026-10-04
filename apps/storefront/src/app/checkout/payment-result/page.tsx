'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button, Heading, Spinner, Text } from '@za/ui';

/**
 * The Stripe Checkout redirect target (ADR 0026) — the `Order` itself
 * doesn't exist yet at this point (it's only materialized later, by the
 * async Stripe webhook), so this page can't fetch or display order
 * details; no polling endpoint exists for a `PaymentSession`'s status
 * either (a disclosed gap, matching this codebase's precedent for
 * Collections/Customers). It only reflects which Stripe redirect fired,
 * and confirmation itself arrives by email once the webhook completes.
 */
function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  if (status === 'cancelled') {
    return (
      // Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11).
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <XCircle
            className="text-brand-dusty mx-auto h-12 w-12 dark:text-neutral-400"
            aria-hidden="true"
          />
          <Heading
            level={2}
            as="h1"
            className="text-brand-ink mt-4 dark:text-neutral-50"
          >
            Payment cancelled
          </Heading>
          <Text muted className="mt-2">
            Your card wasn&apos;t charged and no order was placed. Your cart is
            still here if you&apos;d like to try again.
          </Text>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              onClick={() => router.push('/checkout')}
              className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
            >
              Return to checkout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <CheckCircle2
          className="text-success-500 mx-auto h-12 w-12"
          aria-hidden="true"
        />
        <Heading
          level={2}
          as="h1"
          className="text-brand-ink mt-4 dark:text-neutral-50"
        >
          Payment received
        </Heading>
        <Text muted className="mt-2">
          Thank you! We&apos;re confirming your payment now — you&apos;ll
          receive an email confirmation with your order details shortly.
        </Text>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/shop')}
            className="rounded-brand-pill border-brand-plum text-brand-plum hover:bg-brand-blush"
          >
            Continue shopping
          </Button>
          <Button
            onClick={() => router.push('/account/orders')}
            className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
          >
            View my orders
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
