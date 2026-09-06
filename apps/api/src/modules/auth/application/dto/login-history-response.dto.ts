import type { LoginHistoryEntry } from '../../domain/entities/login-history-entry.entity';

/** `failureReason` is deliberately omitted — internal-only, per ADR 0017 §5. */
export class LoginHistoryResponseDto {
  id!: string;
  emailAttempted!: string;
  success!: boolean;
  ipAddress!: string | null;
  userAgent!: string | null;
  createdAt!: Date;

  static fromDomain(entry: LoginHistoryEntry): LoginHistoryResponseDto {
    const dto = new LoginHistoryResponseDto();
    dto.id = entry.id;
    dto.emailAttempted = entry.emailAttempted;
    dto.success = entry.success;
    dto.ipAddress = entry.ipAddress;
    dto.userAgent = entry.userAgent;
    dto.createdAt = entry.createdAt;
    return dto;
  }
}
