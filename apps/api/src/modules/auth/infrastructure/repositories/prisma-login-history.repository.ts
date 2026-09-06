import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { LoginHistoryEntry } from '../../domain/entities/login-history-entry.entity';
import type {
  LoginHistoryRepository,
  RecordLoginAttemptData,
} from '../../domain/repositories/login-history.repository';
import { LoginHistoryMapper } from '../mappers/login-history.mapper';

@Injectable()
export class PrismaLoginHistoryRepository implements LoginHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(data: RecordLoginAttemptData): Promise<LoginHistoryEntry> {
    const record = await this.prisma.loginHistory.create({
      data: {
        adminUserId: data.adminUserId,
        emailAttempted: data.emailAttempted,
        success: data.success,
        failureReason: data.failureReason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return LoginHistoryMapper.toDomain(record);
  }

  async listByAdminUserId(adminUserId: string): Promise<LoginHistoryEntry[]> {
    const records = await this.prisma.loginHistory.findMany({
      where: { adminUserId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(LoginHistoryMapper.toDomain);
  }
}
