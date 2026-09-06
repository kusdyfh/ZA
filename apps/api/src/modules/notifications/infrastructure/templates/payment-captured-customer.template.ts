import type { PaymentCapturedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function paymentCapturedCustomerTemplate(event: PaymentCapturedEvent): Omit<EmailMessage, 'to'> {
  const formatted = `${event.currencyCode} ${event.amount.toFixed(2)}`;
  return {
    subject: `Payment received for order #${event.orderNumber}`,
    text: `We received your payment of ${formatted} for order #${event.orderNumber}. Thank you!`,
    html: `<p>We received your payment of <strong>${formatted}</strong> for order <strong>#${event.orderNumber}</strong>. Thank you!</p>`,
  };
}
