import type { ReviewSubmittedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function reviewSubmittedAdminAlertTemplate(event: ReviewSubmittedEvent): Omit<EmailMessage, 'to'> {
  return {
    subject: 'New review awaiting moderation',
    text: `A new ${event.rating}-star review was submitted for "${event.productName}" and is awaiting moderation.`,
    html: `<p>A new <strong>${event.rating}-star</strong> review was submitted for <strong>${event.productName}</strong> and is awaiting moderation.</p>`,
  };
}
