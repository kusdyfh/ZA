import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CustomerRefreshToken } from '../../domain/entities/customer-refresh-token.entity';
import type {
  CreateCustomerRefreshTokenData,
  CustomerRefreshTokenRepository,
} from '../../domain/repositories/customer-refresh-token.repository';
import { CustomerRefreshTokenMapper } from '../mappers/customer-refresh-token.mapper';

@Injectable()
export class PrismaCustomerRefreshTokenRepository implements CustomerRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCustomerRefreshTokenData): Promise<CustomerRefreshToken> {
    const record = await this.prisma.customerRefreshToken.create({
      data: {
        jti: data.jti,
        familyId: data.familyId,
        customerId: data.customerId,
        expiresAt: data.expiresAt,
      },
    });
    return CustomerRefreshTokenMapper.toDomain(record);
  }

  async findByJti(jti: string): Promise<CustomerRefreshToken | null> {
    const record = await this.prisma.customerRefreshToken.findUnique({ where: { jti } });
    return record ? CustomerRefreshTokenMapper.toDomain(record) : null;
  }

  async save(token: CustomerRefreshToken): Promise<void> {
    const props = token.toProps();
    await this.prisma.customerRefreshToken.update({
      where: { id: props.id },
      data: { revokedAt: props.revokedAt, replacedByJti: props.replacedByJti },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.customerRefreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForCustomer(customerId: string): Promise<void> {
    await this.prisma.customerRefreshToken.updateMany({
      where: { customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
