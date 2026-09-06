import { CurrencyMismatchError, InvalidMoneyAmountError } from '../errors/catalog.errors';

/**
 * Amounts are stored internally as integer minor units (cents) to avoid
 * floating-point comparison bugs — sufficient for a single-currency
 * store comparing/displaying prices; genuine multi-currency arithmetic
 * (conversion, rounding rules per currency) is a Checkout/Payments-epoch
 * concern, not this one.
 */
export class Money {
  private constructor(
    private readonly amountMinorUnits: number,
    private readonly currencyCode: string,
  ) {}

  static create(amount: number | string, currencyCode: string): Money {
    const numeric = typeof amount === 'string' ? Number(amount) : amount;
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new InvalidMoneyAmountError(String(amount));
    }
    return new Money(Math.round(numeric * 100), currencyCode.toUpperCase());
  }

  get currency(): string {
    return this.currencyCode;
  }

  toDecimalString(): string {
    return (this.amountMinorUnits / 100).toFixed(2);
  }

  toNumber(): number {
    return this.amountMinorUnits / 100;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountMinorUnits > other.amountMinorUnits;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountMinorUnits < other.amountMinorUnits;
  }

  equals(other: Money): boolean {
    return this.amountMinorUnits === other.amountMinorUnits && this.currencyCode === other.currencyCode;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new CurrencyMismatchError(this.currencyCode, other.currencyCode);
    }
  }
}
