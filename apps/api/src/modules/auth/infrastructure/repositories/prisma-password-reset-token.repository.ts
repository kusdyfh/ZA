import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type {
  CreatePasswordResetTokenData,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
    private readonly storeContext: StoreContext,
  ) {}

  /**
   * Wrapped in `$transaction` so `PasswordResetRequested` commits in the
   * same transaction as the token row (ADR 0002/0023). `AdminUser` has
   * no `storeId` of its own (gap #1) — resolved via `StoreContext` like
   * every other ambient "current store" need in this single-tenant app.
   */
  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.passwordResetToken.create({
        data: {
          tokenHash: data.tokenHash,
          adminUserId: data.adminUserId,
          expiresAt: data.expiresAt,
        },
      });

      await this.outbox.writeInTransaction(tx, {
        storeId,
        eventType: EVENT_TYPES.PASSWORD_RESET_REQUESTED,
        aggregateId: data.adminUserId,
        aggregateType: 'AdminUser',
        payload: { adminUserId: data.adminUserId, email: data.email, rawToken: data.rawToken },
      });

      return created;
    });
    return PasswordResetTokenMapper.toDomain(record);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return record ? PasswordResetTokenMapper.toDomain(record) : null;
  }

  async save(token: PasswordResetToken): Promise<void> {
    const props = token.toProps();
    await this.prisma.passwordResetToken.update({
      where: { id: props.id },
      data: { usedAt: props.usedAt },
    });
  }
}
