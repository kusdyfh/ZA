import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import type { Request } from 'express';

/**
 * Reads the `ActorRef` attached by `TemporaryAdminGuard` — see
 * docs/v2/adr/0016-api-layer-conventions.md §2. Only meaningful on
 * guarded (non-`@Public()`) routes; undefined on public ones.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorRef => {
    const request = ctx.switchToHttp().getRequest<Request & { actor?: ActorRef }>();
    return request.actor as ActorRef;
  },
);
