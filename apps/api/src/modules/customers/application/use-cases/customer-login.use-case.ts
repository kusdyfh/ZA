import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import type { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { InvalidCredentialsError } from '../../domain/errors/customer.errors';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../domain/repositories/customer.repository';
import {
  CUSTOMER_PASSWORD_HASHER,
  type PasswordHasher,
} from '../../domain/services/password-hasher';
import {
  CUSTOMER_REFRESH_TOKEN_REPOSITORY,
  type CustomerRefreshTokenRepository,
} from '../../domain/repositories/customer-refresh-token.repository';
import {
  CUSTOMER_TOKEN_SERVICE,
  type CustomerTokenService,
} from '../../domain/services/customer-token.service';
import { MergeGuestCartUseCase } from './merge-guest-cart.use-case';
import { AssociateGuestOrdersUseCase } from './associate-guest-orders.use-case';

export interface CustomerLoginInput {
  email: string;
  password: string;
  guestToken?: string | null;
}

export interface CustomerLoginResult {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
}

/**
 * Same anti-enumeration discipline as staff login (ADR 0017 §1) — one
 * generic `InvalidCredentialsError` for unknown email, wrong password,
 * or anything else. Also re-runs the guest merge/association (ADR 0018
 * §3-4) whenever a `guestToken` is supplied, since a *returning*
 * customer with an active guest session needs the same treatment as a
 * brand-new one.
 */
@Injectable()
export class CustomerLoginUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(CUSTOMER_PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(CUSTOMER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: CustomerRefreshTokenRepository,
    @Inject(CUSTOMER_TOKEN_SERVICE) private readonly tokens: CustomerTokenService,
    private readonly storeContext: StoreContext,
    private readonly mergeGuestCart: MergeGuestCartUseCase,
    private readonly associateGuestOrders: AssociateGuestOrdersUseCase,
  ) {}

  async execute(input: CustomerLoginInput): Promise<CustomerLoginResult> {
    const storeId = await this.storeContext.getCurrentStoreId();

    let customer: Customer | null = null;
    try {
      const email = Email.create(input.email);
      customer = await this.customers.findByEmail(storeId, email);
    } catch {
      throw new InvalidCredentialsError();
    }

    if (!customer) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, customer.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (input.guestToken) {
      await this.mergeGuestCart.execute({ customerId: customer.id, guestToken: input.guestToken });
    }
    await this.associateGuestOrders.execute({
      customerId: customer.id,
      email: customer.email.toString(),
      storeId,
    });

    const familyId = randomUUID();
    const jti = randomUUID();
    const accessToken = await this.tokens.signAccessToken(customer.id);
    const refreshToken = await this.tokens.signRefreshToken(customer.id, jti, familyId);
    await this.refreshTokens.create({
      jti,
      familyId,
      customerId: customer.id,
      expiresAt: new Date(Date.now() + CustomerPolicy.REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return { accessToken, refreshToken, customer };
  }
}
