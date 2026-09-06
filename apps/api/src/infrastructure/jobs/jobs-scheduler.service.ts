import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue-names';

const OUTBOX_RELAY_INTERVAL_MS = 5_000;
const MAINTENANCE_INTERVAL_MS = 60_000;

/**
 * Registers the two repeatable jobs this epic needs, via BullMQ's own
 * repeat feature — never `@nestjs/schedule` performing the work directly
 * (ADR 0003: every PM2 cluster worker would otherwise fire the same
 * `@Cron` independently). `jobId` makes registration idempotent — safe
 * to run on every `za-worker` boot without creating duplicate schedules.
 */
@Injectable()
export class JobsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobsSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.OUTBOX_RELAY) private readonly outboxRelayQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MAINTENANCE) private readonly maintenanceQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.outboxRelayQueue.add(
      'relay-tick',
      {},
      { repeat: { every: OUTBOX_RELAY_INTERVAL_MS }, jobId: 'outbox-relay-scheduler' },
    );
    await this.maintenanceQueue.add(
      'expire-reservations',
      {},
      { repeat: { every: MAINTENANCE_INTERVAL_MS }, jobId: 'expire-reservations-scheduler' },
    );
    this.logger.log(
      `Scheduled repeatable jobs: outbox-relay every ${OUTBOX_RELAY_INTERVAL_MS}ms, expire-reservations every ${MAINTENANCE_INTERVAL_MS}ms`,
    );
  }
}
