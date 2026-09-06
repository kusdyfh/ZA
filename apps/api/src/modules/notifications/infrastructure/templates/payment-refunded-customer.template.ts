import type { PaymentRefundedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function paymentRefundedCustomerTemplate(event: PaymentRefundedEvent): Omit<EmailMessage, 'to'> {
  const formatted = `${event.currencyCode} ${event.amount.toFixed(2)}`;
  return {
    subject: `Refund issued for order #${event.orderNumber}`,
    text: `We've issued a refund of ${formatted} for order #${event.orderNumber}. It may take a few days to appear.`,
    html: `<p>We've issued a refund of <strong>${formatted}</strong> for order <strong>#${event.orderNumber}</strong>. It may take a few days to appear.</p>`,
  };
}
