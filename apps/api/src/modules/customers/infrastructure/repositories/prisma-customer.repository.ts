import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Customer } from '../../domain/entities/customer.entity';
import { Email } from '../../domain/value-objects/email.vo';
import type {
  CreateCustomerData,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { CustomerMapper } from '../mappers/customer.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
  ) {}

  /** Wrapped in `$transaction` so `CustomerRegistered` commits in the same transaction as the row itself (ADR 0002/0023). */
  async create(data: CreateCustomerData): Promise<Customer> {
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          storeId: data.storeId,
          email: data.email.toString(),
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          marketingOptIn: data.marketingOptIn,
          cartToken: data.cartToken,
        },
      });

      await this.outbox.writeInTransaction(tx, {
        storeId: data.storeId,
        eventType: EVENT_TYPES.CUSTOMER_REGISTERED,
        aggregateId: created.id,
        aggregateType: 'Customer',
        payload: { customerId: created.id, email: created.email, firstName: created.firstName },
      });

      return created;
    });
    return CustomerMapper.toDomain(record);
  }

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { id } });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async findByEmail(storeId: string, email: Email): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({
      where: { storeId_email: { storeId, email: email.toString() } },
    });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async save(customer: Customer): Promise<void> {
    const props = customer.toProps();
    await this.prisma.customer.update({
      where: { id: props.id },
      data: {
        passwordHash: props.passwordHash,
        firstName: props.firstName,
        lastName: props.lastName,
        phone: props.phone,
        marketingOptIn: props.marketingOptIn,
      },
    });
  }
}
