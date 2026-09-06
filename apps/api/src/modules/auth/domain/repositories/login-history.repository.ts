import type { LoginHistoryEntry } from '../entities/login-history-entry.entity';

export const LOGIN_HISTORY_REPOSITORY = Symbol('LOGIN_HISTORY_REPOSITORY');

export interface RecordLoginAttemptData {
  adminUserId: string | null;
  emailAttempted: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginHistoryRepository {
  record(data: RecordLoginAttemptData): Promise<LoginHistoryEntry>;
  listByAdminUserId(adminUserId: string): Promise<LoginHistoryEntry[]>;
}
