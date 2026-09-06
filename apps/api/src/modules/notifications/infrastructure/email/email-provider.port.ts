export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Provider-based, replaceable (ADR 0024) — swapping SMTP for SES/Postmark/Resend later means one new class, one line in `NotificationsWorkerModule`. */
export interface EmailProviderPort {
  send(message: EmailMessage): Promise<void>;
}
