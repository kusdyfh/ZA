import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ActorRef } from '@za/types';
import type { Request } from 'express';
import type { PermissionKey } from '../../modules/identity/domain/constants/permissions.constants';
import { CheckPermissionUseCase } from '../../modules/identity/application/use-cases/check-permission.use-case';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

/**
 * Real per-route 403s (ADR 0017 §7) — the gap ADR 0016 §2 explicitly
 * left for this epic. Runs after `JwtAuthGuard` (registration order in
 * AppModule matters: `request.actor` must already be set). A route with
 * no `@RequirePermission(...)` still requires authentication (via
 * `JwtAuthGuard`) but no *specific* permission — used only where no
 * other guarded route in that controller needed one either... in
 * practice, every guarded route in this codebase has an explicit
 * permission (ADR 0017 §7's mapping table), so this "no metadata"
 * branch mainly protects against a future controller forgetting to
 * annotate a new endpoint (it fails open to "authenticated," never to
 * "public").
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermission = this.reflector.getAllAndOverride<PermissionKey | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { actor?: ActorRef }>();
    const actor = request.actor;
    if (!actor?.actorId) {
      // JwtAuthGuard already ran and would have thrown if unauthenticated
      // (and always sets a real, non-null actorId); this is defensive,
      // not a real reachable path.
      throw new ForbiddenException(`Missing required permission "${requiredPermission}".`);
    }

    const allowed = await this.checkPermission.execute({
      adminUserId: actor.actorId,
      permissionKey: requiredPermission,
    });
    if (!allowed) {
      throw new ForbiddenException(`Missing required permission "${requiredPermission}".`);
    }

    return true;
  }
}
