import { ActorType } from '@za/types';
import type { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { DispatchNotificationEventUseCase } from './dispatch-notification-event.use-case';
import type { NotificationRepository } from '../../../../infrastructure/notifications/notification.repository';
import type { NotificationPreferenceRepository } from '../../../../infrastructure/notifications/notification-preference.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';
import { NOTIFICATION_TYPES } from '../../domain/notification-types';

describe('DispatchNotificationEventUseCase', () => {
  let notifications: jest.Mocked<NotificationRepository>;
  let preferences: jest.Mocked<NotificationPreferenceRepository>;
  let emailQueue: jest.Mocked<Queue>;
  let storeContext: StoreContext;
  let config: ConfigService;
  let useCase: DispatchNotificationEventUseCase;

  beforeEach(() => {
    notifications = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      markSent: jest.fn(),
      markFailed: jest.fn(),
      list: jest.fn(),
    };
    preferences = {
      isEnabled: jest.fn().mockResolvedValue(true),
      list: jest.fn(),
      setEnabled: jest.fn(),
    };
    emailQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    config = {
      getOrThrow: jest.fn().mockReturnValue({
        storeAdminNotificationEmail: 'admin@za-store.local',
        adminAppUrl: 'http://localhost:3001',
      }),
    } as unknown as ConfigService;
    useCase = new DispatchNotificationEventUseCase(notifications, preferences, emailQueue, storeContext, config);
  });

  it('OrderPlaced: notifies the store admin address and always sends (broadcast, not preference-gated by a specific owner)', async () => {
    await useCase.execute(EVENT_TYPES.ORDER_PLACED, {
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      customerEmail: 'jane@example.com',
      total: 100,
      currencyCode: 'IQD',
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NOTIFICATION_TYPES.ORDER_PLACED_ADMIN_ALERT,
        recipientType: ActorType.ADMIN,
        recipientEmail: 'admin@za-store.local',
        status: 'PENDING',
      }),
    );
    expect(emailQueue.add).toHaveBeenCalledWith('send', expect.objectContaining({ to: 'admin@za-store.local' }), expect.any(Object));
  });

  it('CustomerRegistered: suppresses the email (but still records history) when the customer opted out', async () => {
    preferences.isEnabled.mockResolvedValue(false);

    await useCase.execute(EVENT_TYPES.CUSTOMER_REGISTERED, {
      customerId: 'cust-1',
      email: 'new@example.com',
      firstName: 'Jane',
    });

    expect(preferences.isEnabled).toHaveBeenCalledWith('store-1', ActorType.CUSTOMER, 'cust-1', NOTIFICATION_TYPES.WELCOME_CUSTOMER, 'EMAIL');
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUPPRESSED' }));
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('OrderStatusChanged: never checks preferences — transactional emails always send', async () => {
    await useCase.execute(EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      customerEmail: 'jane@example.com',
      fromStatus: 'PENDING',
      toStatus: 'CONFIRMED',
    });

    expect(preferences.isEnabled).not.toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalled();
  });

  it('PasswordResetRequested: renders the reset link using the configured admin app URL', async () => {
    await useCase.execute(EVENT_TYPES.PASSWORD_RESET_REQUESTED, {
      adminUserId: 'admin-1',
      email: 'staff@example.com',
      rawToken: 'raw-token-value',
    });

    const [, jobData] = emailQueue.add.mock.calls[0] as [string, { html: string }];
    expect(jobData.html).toContain('http://localhost:3001/reset-password?token=raw-token-value');
  });

  it('does nothing for an event type it has no mapping for', async () => {
    // @ts-expect-error deliberately passing an unwired event type
    await useCase.execute('SomeUnwiredEvent', {});

    expect(notifications.create).not.toHaveBeenCalled();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});
