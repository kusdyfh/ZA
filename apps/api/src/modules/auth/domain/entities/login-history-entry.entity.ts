export interface LoginHistoryEntryProps {
  id: string;
  adminUserId: string | null;
  emailAttempted: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Immutable — an audit-log row, same discipline as Inventory's
 * StockMovement. Written once (LoginUseCase), never edited, only ever
 * read back (ListLoginHistoryUseCase). `failureReason` is internal-only:
 * never surfaced through the API, per the anti-enumeration rule that
 * also shapes InvalidCredentialsError's single generic message.
 */
export class LoginHistoryEntry {
  private constructor(private readonly props: LoginHistoryEntryProps) {}

  static reconstitute(props: LoginHistoryEntryProps): LoginHistoryEntry {
    return new LoginHistoryEntry(props);
  }

  get id(): string {
    return this.props.id;
  }

  get adminUserId(): string | null {
    return this.props.adminUserId;
  }

  get emailAttempted(): string {
    return this.props.emailAttempted;
  }

  get success(): boolean {
    return this.props.success;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): LoginHistoryEntryProps {
    return { ...this.props };
  }
}
