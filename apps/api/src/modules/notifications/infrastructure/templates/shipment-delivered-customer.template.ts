import type { ShipmentDeliveredEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function shipmentDeliveredCustomerTemplate(event: ShipmentDeliveredEvent): Omit<EmailMessage, 'to'> {
  return {
    subject: `Your order #${event.orderNumber} has been delivered`,
    text: `Your order #${event.orderNumber} was marked as delivered. We hope you enjoy it!`,
    html: `<p>Your order <strong>#${event.orderNumber}</strong> was marked as delivered. We hope you enjoy it!</p>`,
  };
}
