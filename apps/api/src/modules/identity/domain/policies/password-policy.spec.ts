import { PasswordPolicy } from './password-policy';
import { WeakPasswordError } from '../errors/identity.errors';

describe('PasswordPolicy', () => {
  it('accepts a password at least 10 characters long', () => {
    expect(() => PasswordPolicy.validate('longenough1')).not.toThrow();
  });

  it('rejects a password shorter than 10 characters', () => {
    expect(() => PasswordPolicy.validate('short1')).toThrow(WeakPasswordError);
  });

  it('rejects an empty password', () => {
    expect(() => PasswordPolicy.validate('')).toThrow(WeakPasswordError);
  });
});
