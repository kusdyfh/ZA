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
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <XCircle className="mx-auto h-12 w-12 text-neutral-400" aria-hidden="true" />
        <Heading level={2} as="h1" className="mt-4">
          Payment cancelled
        </Heading>
        <Text muted className="mt-2">
          Your card wasn&apos;t charged and no order was placed. Your cart is still here if you&apos;d like to try again.
        </Text>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => router.push('/checkout')}>Return to checkout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success-500" aria-hidden="true" />
      <Heading level={2} as="h1" className="mt-4">
        Payment received
      </Heading>
      <Text muted className="mt-2">
        Thank you! We&apos;re confirming your payment now — you&apos;ll receive an email confirmation with your order
        details shortly.
      </Text>
      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" onClick={() => router.push('/shop')}>
          Continue shopping
        </Button>
        <Button onClick={() => router.push('/account/orders')}>View my orders</Button>
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
