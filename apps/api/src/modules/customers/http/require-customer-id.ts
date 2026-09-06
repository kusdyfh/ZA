import { UnauthorizedException } from '@nestjs/common';
import type { ActorRef } from '@za/types';

/**
 * `ActorRef.actorId` is `string | null` in general, but `CustomerAuthGuard`
 * only ever attaches one with a real, non-null `Customer.id` — this
 * narrows that invariant at every customer-facing handler that needs it,
 * same pattern as Auth's `resolveAdminUserId` (docs/v2/adr/0017 §7).
 */
export function requireCustomerId(actor: ActorRef): string {
  if (!actor.actorId) {
    throw new UnauthorizedException();
  }
  return actor.actorId;
}
