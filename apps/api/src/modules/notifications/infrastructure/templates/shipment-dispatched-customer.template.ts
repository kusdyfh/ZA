import type { ShipmentDispatchedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function shipmentDispatchedCustomerTemplate(event: ShipmentDispatchedEvent): Omit<EmailMessage, 'to'> {
  const trackingLine = event.trackingNumber
    ? ` Tracking number: ${event.trackingNumber}${event.trackingUrl ? ` (${event.trackingUrl})` : ''}.`
    : '';
  return {
    subject: `Your order #${event.orderNumber} has shipped`,
    text: `Your order #${event.orderNumber} is on its way.${trackingLine}`,
    html: `<p>Your order <strong>#${event.orderNumber}</strong> is on its way.${
      event.trackingNumber
        ? ` Tracking number: <strong>${event.trackingNumber}</strong>${
            event.trackingUrl ? ` (<a href="${event.trackingUrl}">track it here</a>)` : ''
          }.`
        : ''
    }</p>`,
  };
}
