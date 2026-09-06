import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ActorType } from '@za/types';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../../shared/config/configuration';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../../../infrastructure/notifications/notification.repository';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  type NotificationPreferenceRepository,
} from '../../../../infrastructure/notifications/notification-preference.repository';
import { EVENT_TYPES, type EventPayloadMap, type WiredEventType } from '../../../../infrastructure/events/domain-events';
import { NOTIFICATION_TYPES } from '../../domain/notification-types';
import { QUEUE_NAMES } from '../../../../infrastructure/jobs/queue-names';
import { passwordResetRequestedTemplate } from '../../infrastructure/templates/password-reset-requested.template';
import { orderPlacedAdminAlertTemplate } from '../../infrastructure/templates/order-placed-admin-alert.template';
import { orderStatusChangedCustomerTemplate } from '../../infrastructure/templates/order-status-changed-customer.template';
import { welcomeCustomerTemplate } from '../../infrastructure/templates/welcome-customer.template';
import { reviewSubmittedAdminAlertTemplate } from '../../infrastructure/templates/review-submitted-admin-alert.template';
import { paymentCapturedCustomerTemplate } from '../../infrastructure/templates/payment-captured-customer.template';
import { paymentRefundedCustomerTemplate } from '../../infrastructure/templates/payment-refunded-customer.template';
import { shipmentDispatchedCustomerTemplate } from '../../infrastructure/templates/shipment-dispatched-customer.template';
import { shipmentDeliveredCustomerTemplate } from '../../infrastructure/templates/shipment-delivered-customer.template';

interface ResolvedNotification {
  type: string;
  recipientType: ActorType;
  /** Preference lookup key — `null` skips the preference check entirely (transactional emails: order-status, password-reset). */
  preferenceOwnerId: string | null;
  recipientEmail: string;
  subject: string;
  html: string;
  text: string;
}

/** The `notifications` queue processor's core logic — resolves recipient/template/preference for one dispatched domain event, writes History, and (if not suppressed) enqueues the actual send. */
@Injectable()
export class DispatchNotificationEventUseCase {
  private readonly logger = new Logger(DispatchNotificationEventUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY) private readonly preferences: NotificationPreferenceRepository,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    private readonly storeContext: StoreContext,
    private readonly config: ConfigService,
  ) {}

  async execute(eventType: WiredEventType, payload: unknown): Promise<void> {
    const resolved = this.resolve(eventType, payload as EventPayloadMap[WiredEventType]);
    if (!resolved) {
      this.logger.warn(`No notification mapping for event type "${eventType}" — skipping.`);
      return;
    }

    const storeId = await this.storeContext.getCurrentStoreId();
    const enabled =
      resolved.preferenceOwnerId === null ||
      (await this.preferences.isEnabled(storeId, resolved.recipientType, resolved.preferenceOwnerId, resolved.type, 'EMAIL'));

    const record = await this.notifications.create({
      storeId,
      type: resolved.type,
      channel: 'EMAIL',
      recipientType: resolved.recipientType,
      recipientId: resolved.preferenceOwnerId,
      recipientEmail: resolved.recipientEmail,
      subject: resolved.subject,
      body: resolved.html,
      status: enabled ? 'PENDING' : 'SUPPRESSED',
    });

    if (!enabled || !resolved.recipientEmail) {
      return;
    }

    await this.emailQueue.add(
      'send',
      { notificationId: record.id, to: resolved.recipientEmail, subject: resolved.subject, html: resolved.html, text: resolved.text },
      { jobId: `email-${record.id}` },
    );
  }

  private resolve(eventType: WiredEventType, payload: EventPayloadMap[WiredEventType]): ResolvedNotification | null {
    const appConfig = this.config.getOrThrow<AppConfig>('app');

    switch (eventType) {
      case EVENT_TYPES.ORDER_PLACED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.ORDER_PLACED];
        const template = orderPlacedAdminAlertTemplate(event);
        return {
          type: NOTIFICATION_TYPES.ORDER_PLACED_ADMIN_ALERT,
          recipientType: ActorType.ADMIN,
          preferenceOwnerId: 'STORE',
          recipientEmail: appConfig.storeAdminNotificationEmail,
          ...template,
        };
      }
      case EVENT_TYPES.REVIEW_SUBMITTED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.REVIEW_SUBMITTED];
        const template = reviewSubmittedAdminAlertTemplate(event);
        return {
          type: NOTIFICATION_TYPES.REVIEW_SUBMITTED_ADMIN_ALERT,
          recipientType: ActorType.ADMIN,
          preferenceOwnerId: 'STORE',
          recipientEmail: appConfig.storeAdminNotificationEmail,
          ...template,
        };
      }
      case EVENT_TYPES.CUSTOMER_REGISTERED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.CUSTOMER_REGISTERED];
        const template = welcomeCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.WELCOME_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: event.customerId,
          recipientEmail: event.email,
          ...template,
        };
      }
      case EVENT_TYPES.ORDER_STATUS_CHANGED: {
        // Transactional (informational about the customer's own order) —
        // never preference-gated, the same convention most e-commerce
        // platforms use for order-status emails vs. marketing ones.
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.ORDER_STATUS_CHANGED];
        const template = orderStatusChangedCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.ORDER_STATUS_CHANGED_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: null,
          recipientEmail: event.customerEmail,
          ...template,
        };
      }
      case EVENT_TYPES.PASSWORD_RESET_REQUESTED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.PASSWORD_RESET_REQUESTED];
        const template = passwordResetRequestedTemplate(event, appConfig.adminAppUrl);
        return {
          type: NOTIFICATION_TYPES.PASSWORD_RESET_REQUESTED,
          recipientType: ActorType.ADMIN,
          preferenceOwnerId: null,
          recipientEmail: event.email,
          ...template,
        };
      }
      case EVENT_TYPES.PAYMENT_CAPTURED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.PAYMENT_CAPTURED];
        const template = paymentCapturedCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.PAYMENT_CAPTURED_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: null,
          recipientEmail: event.customerEmail,
          ...template,
        };
      }
      case EVENT_TYPES.PAYMENT_FAILED:
        // Per docs/product/07-ORDERS.md: a failed/abandoned card attempt
        // never creates an Order, so there is nothing to tell the
        // customer about — logged only (see the `resolve()` caller's
        // "No notification mapping" warn), no email sent.
        return null;
      case EVENT_TYPES.PAYMENT_REFUNDED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.PAYMENT_REFUNDED];
        const template = paymentRefundedCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.PAYMENT_REFUNDED_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: null,
          recipientEmail: event.customerEmail,
          ...template,
        };
      }
      case EVENT_TYPES.SHIPMENT_DISPATCHED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.SHIPMENT_DISPATCHED];
        const template = shipmentDispatchedCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.SHIPMENT_DISPATCHED_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: null,
          recipientEmail: event.customerEmail,
          ...template,
        };
      }
      case EVENT_TYPES.SHIPMENT_DELIVERED: {
        const event = payload as EventPayloadMap[typeof EVENT_TYPES.SHIPMENT_DELIVERED];
        const template = shipmentDeliveredCustomerTemplate(event);
        return {
          type: NOTIFICATION_TYPES.SHIPMENT_DELIVERED_CUSTOMER,
          recipientType: ActorType.CUSTOMER,
          preferenceOwnerId: null,
          recipientEmail: event.customerEmail,
          ...template,
        };
      }
      default:
        return null;
    }
  }
}
