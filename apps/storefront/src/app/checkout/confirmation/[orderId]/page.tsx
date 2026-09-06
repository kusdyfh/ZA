'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, CardContent, ErrorState, Heading, Text } from '@za/ui';
import { formatCurrency } from '@za/shared';
import { useOrderConfirmationQuery } from '@/features/orders/api';

export default function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { data: order } = useOrderConfirmationQuery(params.orderId);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="We couldn't find that confirmation"
          description="This page only works right after placing an order in this browser session. If you have an account, sign in to see your order in Order History."
          action={<Button onClick={() => router.push('/account/orders')}>Go to order history</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success-500" aria-hidden="true" />
      <Heading level={2} as="h1" className="mt-4">
        Thank you for your order!
      </Heading>
      <Text muted className="mt-2">
        Order #{order.orderNumber} has been placed and will be paid via Cash on Delivery.
      </Text>

      <Card className="mt-8 text-start">
        <CardContent className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-neutral-700 dark:text-neutral-300">
                {item.productNameSnapshot} × {item.quantity}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-50">
                {formatCurrency(item.lineTotal, { currency: order.currencyCode })}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-neutral-200 pt-3 font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">
            <span>Total</span>
            <span>{formatCurrency(order.total, { currency: order.currencyCode })}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" onClick={() => router.push('/shop')}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
