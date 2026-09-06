import { Inject, Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActorType, type ActorRef } from '@za/types';
import type { Request } from 'express';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../modules/identity/domain/repositories/admin-user.repository';
import { TOKEN_SERVICE, type TokenService } from '../../modules/auth/domain/services/token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Replaces `TemporaryAdminGuard` (ADR 0016 §2) per ADR 0017 §1/§7/§8 —
 * verifies `Authorization: Bearer <access-token>` instead of trusting an
 * `x-admin-user-id` header. Still re-fetches the `AdminUser` from
 * Postgres on every request (same as the guard it replaces) so
 * deactivation takes effect immediately rather than only once the
 * access token expires — the JWT proves *who's asking*, not that
 * they're still allowed in right now.
 *
 * Global (`APP_GUARD`), `@Public()` opt-out — every public/guarded split
 * ADR 0016 established is unchanged; only the credential transport is.
 * Auth failures throw a plain `UnauthorizedException` (not a
 * `DomainError`) — same convention as the guard it replaces.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { actor?: ActorRef }>();
    const accessToken = this.extractBearerToken(request);
    if (!accessToken) {
      throw new UnauthorizedException('Missing or malformed "Authorization" header.');
    }

    const payload = await this.tokens.verifyAccessToken(accessToken).catch(() => null);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const adminUser = await this.adminUsers.findById(payload.sub);
    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Unknown or inactive admin user.');
    }

    request.actor = { actorId: adminUser.id, actorType: ActorType.ADMIN };
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.header('authorization');
    if (!header) {
      return null;
    }
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }
    return token;
  }
}
