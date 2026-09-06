import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import { ActorType } from '@za/types';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../events/outbox.repository';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../notifications/notification.repository';
import { FailedJobLogRepository } from './failed-job-log.repository';
import { QUEUE_NAMES } from './queue-names';

const BATCH_SIZE = 25;

/**
 * The Outbox Relay (ADR 0002/0023) — the one process that ever reads
 * `OutboxEvent`. Runs as a repeatable job (`JobsSchedulerService`), not
 * an HTTP-triggered handler: per event, it emits an in-process
 * `EventEmitter2` event (best-effort hook, ADR 0002's "cheap" channel)
 * and enqueues a durable job on the `notifications` queue named after
 * the event type — that queue's own processor (`modules/notifications`)
 * is the thing that actually decides what, if anything, to send.
 */
@Injectable()
@Processor(QUEUE_NAMES.OUTBOX_RELAY)
export class OutboxRelayProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxRelayProcessor.name);

  constructor(
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    private readonly failedJobLogs: FailedJobLogRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const pending = await this.outbox.findPending(BATCH_SIZE);
    for (const event of pending) {
      await this.dispatchOne(
        event.id,
        event.storeId,
        event.eventType,
        event.aggregateId,
        event.payload,
        event.attempts,
      );
    }
  }

  private async dispatchOne(
    id: string,
    storeId: string,
    eventType: string,
    aggregateId: string,
    payload: unknown,
    attempts: number,
  ): Promise<void> {
    try {
      await this.outbox.markProcessing(id);
      this.eventEmitter.emit(`outbox.${eventType}`, payload);
      await this.notificationsQueue.add(eventType, payload, { jobId: `${eventType}-${aggregateId}-${id}` });
      await this.outbox.markDelivered(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const { attempts: attemptsAfter } = await this.outbox.markFailedAttempt(id, message);
      this.logger.warn(`OutboxEvent ${id} (${eventType}) failed attempt ${attemptsAfter}: ${message}`);
      if (attemptsAfter >= 5) {
        await this.handlePermanentFailure(id, storeId, eventType, message, payload, attempts);
      }
    }
  }

  private async handlePermanentFailure(
    id: string,
    storeId: string,
    eventType: string,
    message: string,
    payload: unknown,
    attempts: number,
  ): Promise<void> {
    await this.failedJobLogs.create({
      queueName: QUEUE_NAMES.OUTBOX_RELAY,
      jobName: eventType,
      payload,
      error: message,
      failedAt: new Date(),
    });
    // ADR 0002 §"Failure handling" — a system-level Notification fires
    // so an admin sees a permanently-undeliverable event in the same
    // History they already check, not only in server logs.
    await this.notifications.create({
      storeId,
      type: 'SYSTEM_OUTBOX_FAILURE',
      channel: 'IN_APP',
      recipientType: ActorType.SYSTEM,
      recipientId: null,
      recipientEmail: null,
      subject: `Event ${eventType} failed permanently`,
      body: `OutboxEvent ${id} (${eventType}) failed after ${attempts + 1} attempts: ${message}`,
      status: 'SENT',
    });
  }
}
