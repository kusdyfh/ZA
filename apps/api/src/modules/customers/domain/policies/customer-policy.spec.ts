import { CustomerPolicy } from './customer-policy';
import {
  InvalidAddressError,
  InvalidCustomerNameError,
  InvalidReviewError,
  WeakPasswordError,
} from '../errors/customer.errors';

describe('CustomerPolicy.validateName', () => {
  it('trims and returns a non-empty name', () => {
    expect(CustomerPolicy.validateName('  Jane  ')).toBe('Jane');
  });

  it('throws for a blank name', () => {
    expect(() => CustomerPolicy.validateName('   ')).toThrow(InvalidCustomerNameError);
  });
});

describe('CustomerPolicy.validatePassword', () => {
  it('accepts a password at least PASSWORD_MIN_LENGTH long', () => {
    expect(() => CustomerPolicy.validatePassword('longenough1')).not.toThrow();
  });

  it('rejects a password shorter than PASSWORD_MIN_LENGTH', () => {
    expect(() => CustomerPolicy.validatePassword('short')).toThrow(WeakPasswordError);
  });
});

const validAddress = {
  fullName: 'Jane Doe',
  phone: '+9647700000000',
  line1: '123 Al-Rasheed Street',
  city: 'Baghdad',
  governorate: 'Baghdad',
  country: 'Iraq',
};

describe('CustomerPolicy.assertValidAddress', () => {
  it('accepts a fully-populated valid address', () => {
    expect(() => CustomerPolicy.assertValidAddress(validAddress)).not.toThrow();
  });

  it('rejects a blank full name', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, fullName: '  ' })).toThrow(
      InvalidAddressError,
    );
  });

  it('rejects an invalid phone', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, phone: 'abc' })).toThrow(
      InvalidAddressError,
    );
  });

  it('rejects a blank line1', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, line1: '' })).toThrow(
      InvalidAddressError,
    );
  });

  it('rejects a blank city', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, city: '' })).toThrow(
      InvalidAddressError,
    );
  });

  it('rejects a blank governorate', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, governorate: '' })).toThrow(
      InvalidAddressError,
    );
  });

  it('rejects a blank country', () => {
    expect(() => CustomerPolicy.assertValidAddress({ ...validAddress, country: '' })).toThrow(
      InvalidAddressError,
    );
  });
});

describe('CustomerPolicy.assertValidReview', () => {
  it('accepts a rating of 1-5 with optional body', () => {
    expect(() => CustomerPolicy.assertValidReview(5, 'Great product!')).not.toThrow();
    expect(() => CustomerPolicy.assertValidReview(1, null)).not.toThrow();
  });

  it('rejects a rating outside 1-5', () => {
    expect(() => CustomerPolicy.assertValidReview(0, null)).toThrow(InvalidReviewError);
    expect(() => CustomerPolicy.assertValidReview(6, null)).toThrow(InvalidReviewError);
  });

  it('rejects a non-integer rating', () => {
    expect(() => CustomerPolicy.assertValidReview(3.5, null)).toThrow(InvalidReviewError);
  });

  it('rejects review text over the max length', () => {
    const tooLong = 'a'.repeat(CustomerPolicy.REVIEW_BODY_MAX_LENGTH + 1);
    expect(() => CustomerPolicy.assertValidReview(4, tooLong)).toThrow(InvalidReviewError);
  });
});
