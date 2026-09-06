export interface PasswordResetTokenProps {
  id: string;
  tokenHash: string;
  adminUserId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Single-use, 30-minute password reset token (ADR 0017 §4). `tokenHash`
 * is a SHA-256 hash of the raw bearer secret — unlike RefreshToken.jti,
 * possessing this row's plaintext value alone is sufficient to reset the
 * password, so it must never be recoverable from a database read.
 */
export class PasswordResetToken {
  private constructor(private props: PasswordResetTokenProps) {}

  static reconstitute(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isValid(now: Date = new Date()): boolean {
    return !this.isUsed() && !this.isExpired(now);
  }

  markUsed(): void {
    this.props.usedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get adminUserId(): string {
    return this.props.adminUserId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  toProps(): PasswordResetTokenProps {
    return { ...this.props };
  }
}
