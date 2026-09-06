import { Module } from '@nestjs/common';
import { ADMIN_USER_REPOSITORY } from './domain/repositories/admin-user.repository';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { AuthorizationService } from './domain/services/authorization.service';
import { PrismaAdminUserRepository } from './infrastructure/repositories/prisma-admin-user.repository';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './infrastructure/repositories/prisma-permission.repository';
import { Argon2PasswordHasher } from './infrastructure/hashing/argon2-password-hasher';
import { CreateAdminUserUseCase } from './application/use-cases/create-admin-user.use-case';
import { DeactivateAdminUserUseCase } from './application/use-cases/deactivate-admin-user.use-case';
import { ActivateAdminUserUseCase } from './application/use-cases/activate-admin-user.use-case';
import { ChangeAdminUserRoleUseCase } from './application/use-cases/change-admin-user-role.use-case';
import { CheckPermissionUseCase } from './application/use-cases/check-permission.use-case';
import { ListAdminUsersUseCase } from './application/use-cases/list-admin-users.use-case';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { ListPermissionsUseCase } from './application/use-cases/list-permissions.use-case';
import { GetRoleWithPermissionsUseCase } from './application/use-cases/get-role-with-permissions.use-case';
import { AdminUsersController } from './http/admin-users.controller';
import { RolesController } from './http/roles.controller';
import { PermissionsController } from './http/permissions.controller';

/**
 * The Identity bounded context (docs/06-DDD-BOUNDED-CONTEXTS.md) — User/
 * Role/Permission domains, RBAC, and authorization policies. Epic 6
 * (API Layer) adds controllers for this module directly (not a
 * cross-module concern), gated by `TemporaryAdminGuard`.
 */
@Module({
  controllers: [AdminUsersController, RolesController, PermissionsController],
  providers: [
    { provide: ADMIN_USER_REPOSITORY, useClass: PrismaAdminUserRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    AuthorizationService,
    CreateAdminUserUseCase,
    DeactivateAdminUserUseCase,
    ActivateAdminUserUseCase,
    ChangeAdminUserRoleUseCase,
    CheckPermissionUseCase,
    ListAdminUsersUseCase,
    ListRolesUseCase,
    ListPermissionsUseCase,
    GetRoleWithPermissionsUseCase,
  ],
  exports: [
    CreateAdminUserUseCase,
    DeactivateAdminUserUseCase,
    ActivateAdminUserUseCase,
    ChangeAdminUserRoleUseCase,
    CheckPermissionUseCase,
    ListAdminUsersUseCase,
    ListRolesUseCase,
    ListPermissionsUseCase,
    GetRoleWithPermissionsUseCase,
    // ADMIN_USER_REPOSITORY is exported (in addition to use-cases) so
    // the app-wide JwtAuthGuard (docs/v2/adr/0017, formerly
    // TemporaryAdminGuard per docs/v2/adr/0016) can resolve a JWT's
    // `sub` claim to a real, active AdminUser — the same additive-export
    // precedent as Catalog's PRODUCT_REPOSITORY. PASSWORD_HASHER is
    // exported for the same reason: AuthModule's Login/ChangePassword/
    // ResetPassword use-cases (Epic 7) verify/hash passwords without
    // reimplementing Argon2PasswordHasher.
    ADMIN_USER_REPOSITORY,
    PASSWORD_HASHER,
  ],
})
export class IdentityModule {}
