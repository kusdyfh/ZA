import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PasswordHasher } from '../../domain/services/password-hasher';

/**
 * Argon2id, per docs/12-SECURITY-REVIEW.md §10 — memory-hard, current
 * best practice over bcrypt.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, { type: argon2.argon2id });
  }

  verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, plainPassword);
  }
}
