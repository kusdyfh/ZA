import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { AdminUser } from '../../domain/entities/admin-user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordPolicy } from '../../domain/policies/password-policy';
import { EmailAlreadyInUseError, RoleNotFoundError } from '../../domain/errors/identity.errors';
import {
  ADMIN_USER_REPOSITORY,
  type AdminUserRepository,
} from '../../domain/repositories/admin-user.repository';
import { ROLE_REPOSITORY, type RoleRepository } from '../../domain/repositories/role.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../domain/services/password-hasher';

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  actor: ActorRef;
}

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly adminUsers: AdminUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateAdminUserInput): Promise<AdminUser> {
    const name = AdminUser.validateName(input.name);
    const email = Email.create(input.email);
    PasswordPolicy.validate(input.password);

    const role = await this.roles.findById(input.roleId);
    if (!role) {
      throw new RoleNotFoundError(input.roleId);
    }

    const existing = await this.adminUsers.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError(email.toString());
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.adminUsers.create({
      name,
      email,
      passwordHash,
      roleId: role.id,
      actor: input.actor,
    });
  }
}
