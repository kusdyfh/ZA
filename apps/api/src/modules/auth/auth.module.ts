import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityModule } from '../identity/identity.module';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository';
import { LOGIN_HISTORY_REPOSITORY } from './domain/repositories/login-history.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { TOKEN_SERVICE } from './domain/services/token.service';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaLoginHistoryRepository } from './infrastructure/repositories/prisma-login-history.repository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/repositories/prisma-password-reset-token.repository';
import { JwtTokenService } from './infrastructure/tokens/jwt-token.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshAccessTokenUseCase } from './application/use-cases/refresh-access-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { ListSessionsUseCase } from './application/use-cases/list-sessions.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { ListLoginHistoryUseCase } from './application/use-cases/list-login-history.use-case';
import { AuthController } from './http/auth.controller';

/**
 * The Authentication bounded context (ADR 0017) — deliberately separate
 * from Identity (which owns AdminUser/Role/Permission/RBAC data) per the
 * epic's "keep authentication separate from business logic" rule.
 * Imports IdentityModule for AdminUserRepository/PasswordHasher/
 * CheckPermissionUseCase rather than re-implementing any of it — the
 * same cross-module dependency shape as Checkout importing
 * Catalog/Inventory/Orders.
 *
 * `JwtModule.register({})` is deliberately registered with NO default
 * secret — `JwtTokenService` passes `JWT_ACCESS_SECRET`/
 * `JWT_REFRESH_SECRET` explicitly on every sign/verify call, so there's
 * no ambient default a future call site could accidentally rely on for
 * the wrong token type.
 */
@Module({
  imports: [IdentityModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: LOGIN_HISTORY_REPOSITORY, useClass: PrismaLoginHistoryRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: PrismaPasswordResetTokenRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    LoginUseCase,
    LogoutUseCase,
    RefreshAccessTokenUseCase,
    ChangePasswordUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ListSessionsUseCase,
    RevokeSessionUseCase,
    ListLoginHistoryUseCase,
  ],
  exports: [TOKEN_SERVICE],
})
export class AuthModule {}
