import { Email } from './email.vo';
import { InvalidEmailError } from '../errors/identity.errors';

describe('Email', () => {
  it('normalizes casing and surrounding whitespace', () => {
    const email = Email.create('  Someone@Example.COM  ');
    expect(email.toString()).toBe('someone@example.com');
  });

  it('rejects a value without an @', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError);
  });

  it('rejects a value without a domain', () => {
    expect(() => Email.create('someone@')).toThrow(InvalidEmailError);
  });

  it('treats two emails differing only by case/whitespace as equal', () => {
    const a = Email.create('Someone@Example.com');
    const b = Email.create(' someone@example.com ');
    expect(a.equals(b)).toBe(true);
  });

  it('treats different addresses as not equal', () => {
    const a = Email.create('a@example.com');
    const b = Email.create('b@example.com');
    expect(a.equals(b)).toBe(false);
  });
});
