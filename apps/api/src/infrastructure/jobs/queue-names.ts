/**
 * The four BullMQ queues this epic actually registers (ADR 0023) — a
 * deliberately smaller set than ADR 0003's full six; `webhooks` and
 * `search-index-sync` have no real publisher or consumer in this
 * codebase yet and are added when one exists, not registered as empty
 * scaffolding now.
 */
export const QUEUE_NAMES = {
  OUTBOX_RELAY: 'outbox-relay',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  MAINTENANCE: 'maintenance',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
