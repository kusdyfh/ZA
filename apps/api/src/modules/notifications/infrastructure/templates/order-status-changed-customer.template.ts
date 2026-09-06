import type { OrderStatusChangedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function orderStatusChangedCustomerTemplate(event: OrderStatusChangedEvent): Omit<EmailMessage, 'to'> {
  const status = event.toStatus.toLowerCase();
  return {
    subject: `Your order #${event.orderNumber} is now ${status}`,
    text: `Your order #${event.orderNumber} status changed to ${status}.`,
    html: `<p>Your order <strong>#${event.orderNumber}</strong> status changed to <strong>${status}</strong>.</p>`,
  };
}
