import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../../infrastructure/jobs/queue-names';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../../../infrastructure/notifications/notification.repository';
import { EMAIL_PROVIDER, type EmailProviderPort } from '../email/email-provider.port';

interface EmailJobData {
  notificationId: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** The actual SMTP send (ADR 0024) — the last stage of the outbox → notifications → email pipeline. */
@Injectable()
@Processor(QUEUE_NAMES.EMAIL)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProviderPort,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { notificationId, to, subject, html, text } = job.data;
    try {
      await this.emailProvider.send({ to, subject, html, text });
      await this.notifications.markSent(notificationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email for notification ${notificationId}: ${message}`);
      await this.notifications.markFailed(notificationId, message);
      throw error;
    }
  }
}
