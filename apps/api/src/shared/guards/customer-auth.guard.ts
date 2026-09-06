import { Inject, Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ActorType, type ActorRef } from '@za/types';
import type { Request } from 'express';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../modules/customers/domain/repositories/customer.repository';
import {
  CUSTOMER_TOKEN_SERVICE,
  type CustomerTokenService,
} from '../../modules/customers/domain/services/customer-token.service';

/**
 * The customer-facing equivalent of `JwtAuthGuard` (ADR 0018 §2/§5) —
 * verifies a Bearer token against the *customer* secret and loads a
 * `Customer`, not an `AdminUser`. Applied locally via `@UseGuards()`,
 * never globally — every controller in the Customers module is
 * `@Public()` at the class level (staff's global guards would otherwise
 * reject every customer call), and this guard opts specific routes back
 * into requiring a logged-in customer. Populates the same
 * `request.actor`/`@CurrentActor()` shape as staff auth, safe only
 * because no route is ever guarded by both at once.
 */
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    @Inject(CUSTOMER_TOKEN_SERVICE) private readonly tokens: CustomerTokenService,
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { actor?: ActorRef }>();
    const accessToken = this.extractBearerToken(request);
    if (!accessToken) {
      throw new UnauthorizedException('Missing or malformed "Authorization" header.');
    }

    const payload = await this.tokens.verifyAccessToken(accessToken).catch(() => null);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const customer = await this.customers.findById(payload.sub);
    if (!customer) {
      throw new UnauthorizedException('Unknown customer.');
    }

    request.actor = { actorId: customer.id, actorType: ActorType.CUSTOMER };
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
