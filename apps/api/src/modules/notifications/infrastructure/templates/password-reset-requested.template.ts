import type { PasswordResetRequestedEvent } from '../../../../infrastructure/events/domain-events';
import type { EmailMessage } from '../email/email-provider.port';

export function passwordResetRequestedTemplate(event: PasswordResetRequestedEvent, adminAppUrl: string): Omit<EmailMessage, 'to'> {
  const link = `${adminAppUrl}/reset-password?token=${event.rawToken}`;
  return {
    subject: 'Reset your ZA Store password',
    text: `We received a request to reset your password. Use this link within the next hour: ${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset your password</a> (link expires in 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`,
  };
}
