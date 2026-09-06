import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ExpireStockReservationsUseCase } from '../../modules/inventory/application/use-cases/expire-stock-reservations.use-case';
import { QUEUE_NAMES } from './queue-names';

/**
 * The `maintenance` queue's first real job — ADR 0001 §5's reservation-
 * expiry sweep finally has a scheduled caller (closing `PROJECT_STATUS.md`
 * gap #6), via the exact same
 * `ExpireStockReservationsUseCase.execute()` every prior epic already
 * built and tested — untouched here, only a new caller.
 */
@Injectable()
@Processor(QUEUE_NAMES.MAINTENANCE)
export class MaintenanceQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceQueueProcessor.name);

  constructor(private readonly expireStockReservations: ExpireStockReservationsUseCase) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'expire-reservations') {
      return;
    }
    const count = await this.expireStockReservations.execute();
    if (count > 0) {
      this.logger.log(`Expired ${count} stale stock reservation(s).`);
    }
  }
}
