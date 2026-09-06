import type { Prisma } from '@prisma/client';
import type { EventPayloadMap, WiredEventType } from './domain-events';

export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');

/** Any Prisma client capable of running queries — the root `PrismaService` or a `$transaction` callback's `tx`. */
export type PrismaTransactionClient = Prisma.TransactionClient;

export interface WriteOutboxEventInput<T extends WiredEventType = WiredEventType> {
  storeId: string;
  eventType: T;
  aggregateId: string;
  aggregateType: string;
  payload: EventPayloadMap[T];
}

export interface OutboxEventRecord {
  id: string;
  storeId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: unknown;
  attempts: number;
}

/**
 * The transactional outbox (ADR 0002/0023). `writeInTransaction` takes
 * the caller's own Prisma transaction client rather than being injected
 * with one — every call site is itself a repository's `create()`/
 * `changeStatus()` method already inside a `$transaction`, and the whole
 * point of the pattern is that the event row commits in the *same*
 * transaction as the business row it describes. Every other method here
 * is used exclusively by the outbox-relay job (`za-worker`), never from
 * `za-api` request handling.
 */
export interface OutboxRepository {
  writeInTransaction<T extends WiredEventType>(
    tx: PrismaTransactionClient,
    event: WriteOutboxEventInput<T>,
  ): Promise<void>;
  findPending(limit: number): Promise<OutboxEventRecord[]>;
  markProcessing(id: string): Promise<void>;
  markDelivered(id: string): Promise<void>;
  /** Increments `attempts`; the relay itself decides PENDING (retry) vs FAILED (exhausted) based on the returned count. */
  markFailedAttempt(id: string, error: string): Promise<{ attempts: number }>;
  markPermanentlyFailed(id: string, error: string): Promise<void>;
}
