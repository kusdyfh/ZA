import { Money } from './money.vo';
import { CurrencyMismatchError, InvalidMoneyAmountError } from '../errors/catalog.errors';

describe('Money', () => {
  describe('create', () => {
    it('accepts zero and positive amounts', () => {
      expect(Money.create(0, 'IQD').toNumber()).toBe(0);
      expect(Money.create(45000, 'IQD').toNumber()).toBe(45000);
    });

    it('accepts a numeric string amount', () => {
      expect(Money.create('45000.00', 'IQD').toDecimalString()).toBe('45000.00');
    });

    it('rejects a negative amount', () => {
      expect(() => Money.create(-1, 'IQD')).toThrow(InvalidMoneyAmountError);
    });

    it('rejects a non-numeric amount', () => {
      expect(() => Money.create('not-a-number', 'IQD')).toThrow(InvalidMoneyAmountError);
    });

    it('uppercases the currency code', () => {
      expect(Money.create(1, 'iqd').currency).toBe('IQD');
    });
  });

  describe('comparisons', () => {
    it('compares amounts in the same currency', () => {
      const low = Money.create(39000, 'IQD');
      const high = Money.create(45000, 'IQD');
      expect(low.isLessThan(high)).toBe(true);
      expect(high.isGreaterThan(low)).toBe(true);
    });

    it('avoids float precision bugs on fractional amounts', () => {
      const a = Money.create(10.1, 'IQD');
      const b = Money.create(10.2, 'IQD');
      expect(a.isLessThan(b)).toBe(true);
    });

    it('throws when comparing different currencies', () => {
      const iqd = Money.create(1, 'IQD');
      const usd = Money.create(1, 'USD');
      expect(() => iqd.isLessThan(usd)).toThrow(CurrencyMismatchError);
    });

    it('treats equal amount + currency as equal', () => {
      expect(Money.create(100, 'IQD').equals(Money.create(100, 'IQD'))).toBe(true);
    });

    it('treats different currencies as not equal even with the same amount', () => {
      expect(Money.create(100, 'IQD').equals(Money.create(100, 'USD'))).toBe(false);
    });
  });
});
