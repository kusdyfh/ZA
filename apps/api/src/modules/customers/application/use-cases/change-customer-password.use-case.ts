import { Inject, Injectable } from '@nestjs/common';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { CustomerNotFoundError, InvalidCredentialsError } from '../../domain/errors/customer.errors';
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

export interface ChangeCustomerPasswordInput {
  customerId: string;
  currentPassword: string;
  newPassword: string;
}

/** Revokes every session on success — same reasoning as staff (ADR 0017 §4). */
@Injectable()
export class ChangeCustomerPasswordUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(CUSTOMER_PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(CUSTOMER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: CustomerRefreshTokenRepository,
  ) {}

  async execute(input: ChangeCustomerPasswordInput): Promise<void> {
    const customer = await this.customers.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    const matches = await this.passwordHasher.verify(input.currentPassword, customer.passwordHash);
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    CustomerPolicy.validatePassword(input.newPassword);
    const newHash = await this.passwordHasher.hash(input.newPassword);
    customer.changePassword(newHash);
    await this.customers.save(customer);

    await this.refreshTokens.revokeAllForCustomer(customer.id);
  }
}
