export interface PhoneVerificationCodeProps {
  id: string;
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  createdAt: Date;
}

/** Caps wrong-code guesses before the code is invalidated outright (same idea as a login lockout). */
const MAX_ATTEMPTS = 5;

/**
 * Single-use, short-lived WhatsApp OTP for the checkout contact phone.
 * `codeHash` is a SHA-256 hash of the 6-digit code — same "never store
 * the recoverable secret" rule as PasswordResetToken.
 */
export class PhoneVerificationCode {
  private constructor(private props: PhoneVerificationCodeProps) {}

  static reconstitute(
    props: PhoneVerificationCodeProps,
  ): PhoneVerificationCode {
    return new PhoneVerificationCode(props);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isConsumed(): boolean {
    return this.props.consumedAt !== null;
  }

  isVerified(): boolean {
    return this.props.verifiedAt !== null;
  }

  hasTooManyAttempts(): boolean {
    return this.props.attempts >= MAX_ATTEMPTS;
  }

  /** Usable to *attempt* confirmation: not expired, not already consumed, not locked out. */
  canAttempt(now: Date = new Date()): boolean {
    return (
      !this.isExpired(now) && !this.isConsumed() && !this.hasTooManyAttempts()
    );
  }

  /** Usable to *place an order*: successfully verified and not yet spent on a prior order. */
  isUsableForOrder(now: Date = new Date()): boolean {
    return this.isVerified() && !this.isConsumed() && !this.isExpired(now);
  }

  recordFailedAttempt(): void {
    this.props.attempts += 1;
  }

  markVerified(): void {
    this.props.verifiedAt = new Date();
  }

  markConsumed(): void {
    this.props.consumedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get phone(): string {
    return this.props.phone;
  }

  get codeHash(): string {
    return this.props.codeHash;
  }

  toProps(): PhoneVerificationCodeProps {
    return { ...this.props };
  }
}
