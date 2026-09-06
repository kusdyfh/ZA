import type { CustomerRegisteredEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function welcomeCustomerTemplate(event: CustomerRegisteredEvent): Omit<EmailMessage, 'to'> {
  return {
    subject: 'Welcome to ZA Store',
    text: `Hi ${event.firstName}, welcome to ZA Store! Your account is ready.`,
    html: `<p>Hi ${event.firstName},</p><p>Welcome to ZA Store! Your account is ready.</p>`,
  };
}
