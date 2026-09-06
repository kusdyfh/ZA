import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../../infrastructure/jobs/queue-names';
import { WIRED_EVENT_TYPES, type WiredEventType } from '../../../../infrastructure/events/domain-events';
import { DispatchNotificationEventUseCase } from '../../application/use-cases/dispatch-notification-event.use-case';

/** Consumes jobs the outbox relay enqueues (job name = event type) — one job per dispatched domain event (ADR 0024). */
@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsQueueProcessor extends WorkerHost {
  constructor(private readonly dispatchEvent: DispatchNotificationEventUseCase) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (!WIRED_EVENT_TYPES.includes(job.name as WiredEventType)) {
      return;
    }
    await this.dispatchEvent.execute(job.name as WiredEventType, job.data);
  }
}
