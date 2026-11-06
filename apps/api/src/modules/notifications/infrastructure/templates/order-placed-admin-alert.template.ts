import type { OrderPlacedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function orderPlacedAdminAlertTemplate(
  event: OrderPlacedEvent,
): Omit<EmailMessage, 'to'> {
  const total = `${event.currencyCode} ${event.total}`;
  const customer = event.customerEmail ?? 'No email provided';
  return {
    subject: `New order #${event.orderNumber}`,
    text: `A new order was placed.\n\nOrder: #${event.orderNumber}\nCustomer: ${customer}\nTotal: ${total}`,
    html: `<p>A new order was placed.</p><ul><li>Order: #${event.orderNumber}</li><li>Customer: ${customer}</li><li>Total: ${total}</li></ul>`,
  };
}
