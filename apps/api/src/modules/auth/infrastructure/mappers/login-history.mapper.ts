import type { LoginHistory as LoginHistoryRecord } from '@prisma/client';
import { LoginHistoryEntry } from '../../domain/entities/login-history-entry.entity';

export class LoginHistoryMapper {
  static toDomain(this: void, record: LoginHistoryRecord): LoginHistoryEntry {
    return LoginHistoryEntry.reconstitute({
      id: record.id,
      adminUserId: record.adminUserId,
      emailAttempted: record.emailAttempted,
      success: record.success,
      failureReason: record.failureReason,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      createdAt: record.createdAt,
    });
  }
}
