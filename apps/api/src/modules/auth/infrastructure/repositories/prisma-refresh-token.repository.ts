import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import type {
  CreateRefreshTokenData,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const record = await this.prisma.refreshToken.create({
      data: {
        jti: data.jti,
        familyId: data.familyId,
        adminUserId: data.adminUserId,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
    return RefreshTokenMapper.toDomain(record);
  }

  async findByJti(jti: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { jti } });
    return record ? RefreshTokenMapper.toDomain(record) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    const props = token.toProps();
    await this.prisma.refreshToken.update({
      where: { id: props.id },
      data: {
        revokedAt: props.revokedAt,
        replacedByJti: props.replacedByJti,
      },
    });
  }

  async listActiveByAdminUserId(adminUserId: string, now: Date): Promise<RefreshToken[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: { adminUserId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { issuedAt: 'desc' },
    });
    return records.map(RefreshTokenMapper.toDomain);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForAdminUser(adminUserId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
