export interface RefreshTokenProps {
  id: string;
  jti: string;
  familyId: string;
  adminUserId: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByJti: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

/**
 * The server-side half of a refresh token (ADR 0017 §1–2) — the JWT
 * itself carries the signature that makes it unforgeable; this row is
 * what makes it individually revocable and lets reuse of an
 * already-rotated token be detected.
 */
export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
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

  /** Marks this token used — either rotated into `replacedByJti`, or revoked outright (logout, password change). */
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

  get adminUserId(): string {
    return this.props.adminUserId;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  toProps(): RefreshTokenProps {
    return { ...this.props };
  }
}
