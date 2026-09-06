export interface CustomerRefreshTokenProps {
  id: string;
  jti: string;
  familyId: string;
  customerId: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByJti: string | null;
}

/**
 * The customer-side equivalent of Epic 7's `RefreshToken` entity — same
 * rotation/reuse-detection shape (ADR 0017 §1-2 / ADR 0018 §2), a
 * deliberately separate class from a separate table.
 */
export class CustomerRefreshToken {
  private constructor(private props: CustomerRefreshTokenProps) {}

  static reconstitute(props: CustomerRefreshTokenProps): CustomerRefreshToken {
    return new CustomerRefreshToken(props);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isActive(now: Date = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(replacedByJti?: string): void {
    this.props.revokedAt = new Date();
    if (replacedByJti) {
      this.props.replacedByJti = replacedByJti;
    }
  }

  get id(): string {
    return this.props.id;
  }

  get jti(): string {
    return this.props.jti;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  toProps(): CustomerRefreshTokenProps {
    return { ...this.props };
  }
}
