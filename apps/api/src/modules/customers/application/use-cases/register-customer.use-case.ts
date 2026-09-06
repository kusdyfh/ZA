import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Email } from '../../domain/value-objects/email.vo';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { EmailAlreadyInUseError } from '../../domain/errors/customer.errors';
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
import type { Customer } from '../../domain/entities/customer.entity';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  marketingOptIn?: boolean;
  /** A guest cart to merge in, if the visitor was shopping before registering — ADR 0018 §3. */
  guestToken?: string | null;
}

export interface RegisterCustomerResult {
  accessToken: string;
  refreshToken: string;
  customer: Customer;
}

/**
 * Registration also runs the guest→customer merge (cart items + past
 * guest orders under the same email) exactly once, immediately —
 * per the epic's "merge guest data after account creation/login" rule.
 */
@Injectable()
export class RegisterCustomerUseCase {
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

  async execute(input: RegisterCustomerInput): Promise<RegisterCustomerResult> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const email = Email.create(input.email);
    const firstName = CustomerPolicy.validateName(input.firstName);
    const lastName = CustomerPolicy.validateName(input.lastName);
    CustomerPolicy.validatePassword(input.password);

    const existing = await this.customers.findByEmail(storeId, email);
    if (existing) {
      throw new EmailAlreadyInUseError(email.toString());
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const cartToken = randomUUID();

    const customer = await this.customers.create({
      storeId,
      email,
      passwordHash,
      firstName,
      lastName,
      phone: input.phone ?? null,
      marketingOptIn: input.marketingOptIn ?? false,
      cartToken,
    });

    if (input.guestToken) {
      await this.mergeGuestCart.execute({ customerId: customer.id, guestToken: input.guestToken });
    }
    await this.associateGuestOrders.execute({
      customerId: customer.id,
      email: email.toString(),
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
