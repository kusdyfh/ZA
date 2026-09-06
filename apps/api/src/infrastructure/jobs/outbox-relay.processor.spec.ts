import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job, Queue } from 'bullmq';
import { OutboxRelayProcessor } from './outbox-relay.processor';
import type { OutboxRepository } from '../events/outbox.repository';
import type { NotificationRepository } from '../notifications/notification.repository';
import type { FailedJobLogRepository } from './failed-job-log.repository';
import { EVENT_TYPES } from '../events/domain-events';

describe('OutboxRelayProcessor', () => {
  let outbox: jest.Mocked<OutboxRepository>;
  let notifications: jest.Mocked<NotificationRepository>;
  let failedJobLogs: jest.Mocked<FailedJobLogRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let notificationsQueue: jest.Mocked<Queue>;
  let processor: OutboxRelayProcessor;

  const pendingEvent = {
    id: 'outbox-1',
    storeId: 'store-1',
    eventType: EVENT_TYPES.ORDER_PLACED,
    aggregateId: 'order-1',
    aggregateType: 'Order',
    payload: { orderId: 'order-1' },
    attempts: 0,
  };

  beforeEach(() => {
    outbox = {
      writeInTransaction: jest.fn(),
      findPending: jest.fn().mockResolvedValue([pendingEvent]),
      markProcessing: jest.fn(),
      markDelivered: jest.fn(),
      markFailedAttempt: jest.fn(),
      markPermanentlyFailed: jest.fn(),
    };
    notifications = { create: jest.fn(), markSent: jest.fn(), markFailed: jest.fn(), list: jest.fn() };
    failedJobLogs = { create: jest.fn() } as unknown as jest.Mocked<FailedJobLogRepository>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    notificationsQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
    processor = new OutboxRelayProcessor(outbox, notifications, failedJobLogs, eventEmitter, notificationsQueue);
  });

  it('on success: marks processing then delivered, emits in-process, enqueues the notifications job', async () => {
    await processor.process({} as Job);

    expect(outbox.markProcessing).toHaveBeenCalledWith('outbox-1');
    expect(eventEmitter.emit).toHaveBeenCalledWith(`outbox.${EVENT_TYPES.ORDER_PLACED}`, pendingEvent.payload);
    expect(notificationsQueue.add).toHaveBeenCalledWith(
      EVENT_TYPES.ORDER_PLACED,
      pendingEvent.payload,
      { jobId: `${EVENT_TYPES.ORDER_PLACED}-${pendingEvent.aggregateId}-${pendingEvent.id}` },
    );
    expect(outbox.markDelivered).toHaveBeenCalledWith('outbox-1');
    expect(outbox.markFailedAttempt).not.toHaveBeenCalled();
  });

  it('on a transient failure (attempts < 5 after increment): records the failed attempt but does not archive or alert', async () => {
    notificationsQueue.add.mockRejectedValue(new Error('Redis unreachable'));
    outbox.markFailedAttempt.mockResolvedValue({ attempts: 2 });

    await processor.process({} as Job);

    expect(outbox.markFailedAttempt).toHaveBeenCalledWith('outbox-1', 'Redis unreachable');
    expect(failedJobLogs.create).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('once attempts reach 5: archives to FailedJobLog and raises a SYSTEM alert Notification', async () => {
    notificationsQueue.add.mockRejectedValue(new Error('Redis unreachable'));
    outbox.markFailedAttempt.mockResolvedValue({ attempts: 5 });

    await processor.process({} as Job);

    expect(failedJobLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ queueName: 'outbox-relay', jobName: EVENT_TYPES.ORDER_PLACED, error: 'Redis unreachable' }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', type: 'SYSTEM_OUTBOX_FAILURE', status: 'SENT' }),
    );
  });
});
