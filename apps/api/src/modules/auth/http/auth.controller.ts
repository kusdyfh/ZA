import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import type { Request } from 'express';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import type { AppConfig } from '../../../shared/config/configuration';
import { AuthPolicy } from '../domain/policies/auth-policy';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RefreshAccessTokenUseCase } from '../application/use-cases/refresh-access-token.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { ListSessionsUseCase } from '../application/use-cases/list-sessions.use-case';
import { RevokeSessionUseCase } from '../application/use-cases/revoke-session.use-case';
import { ListLoginHistoryUseCase } from '../application/use-cases/list-login-history.use-case';
import { LoginDto } from '../application/dto/login.dto';
import { RefreshTokenDto } from '../application/dto/refresh-token.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { RequestPasswordResetDto } from '../application/dto/request-password-reset.dto';
import { ResetPasswordDto } from '../application/dto/reset-password.dto';
import { AuthTokensResponseDto } from '../application/dto/auth-tokens-response.dto';
import { SessionResponseDto } from '../application/dto/session-response.dto';
import { LoginHistoryResponseDto } from '../application/dto/login-history-response.dto';
import { PasswordResetResponseDto } from '../application/dto/password-reset-response.dto';

/**
 * Staff authentication — ADR 0017. `login`/`refresh`/`request-password-reset`/
 * `reset-password` are `@Public()` (no token exists yet, or a locked-out
 * admin has none); everything else requires a valid access token but no
 * specific `@RequirePermission` — self-service actions on the caller's
 * own account/sessions/history, not an admin-management surface (that's
 * Identity's `AdminUsersController`).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly logout: LogoutUseCase,
    private readonly refreshAccessToken: RefreshAccessTokenUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
    private readonly listLoginHistory: ListLoginHistoryUseCase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * `ActorRef.actorId` is `string | null` in general (SYSTEM actors have
   * none), but `JwtAuthGuard` only ever attaches one with a real,
   * non-null `AdminUser.id` — this narrows that invariant at the one
   * place every self-service handler below needs it.
   */
  private resolveAdminUserId(actor: ActorRef): string {
    if (!actor.actorId) {
      throw new UnauthorizedException();
    }
    return actor.actorId;
  }

  @Public()
  @Throttle({ default: AuthPolicy.LOGIN_RATE_LIMIT })
  @Post('login')
  @ApiCreatedResponse({ type: AuthTokensResponseDto })
  async loginHandler(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.login.execute({
      email: dto.email,
      password: dto.password,
      userAgent: request.header('user-agent') ?? null,
      ipAddress: request.ip ?? null,
    });
    return AuthTokensResponseDto.fromTokens(
      result.accessToken,
      result.refreshToken,
      result.adminUser,
    );
  }

  @Public()
  @Post('refresh')
  @ApiCreatedResponse({ type: AuthTokensResponseDto })
  async refreshHandler(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.refreshAccessToken.execute({
      refreshToken: dto.refreshToken,
      userAgent: request.header('user-agent') ?? null,
      ipAddress: request.ip ?? null,
    });
    return AuthTokensResponseDto.fromTokens(result.accessToken, result.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutHandler(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.logout.execute({ refreshToken: dto.refreshToken });
  }

  @ApiBearerAuth('access-token')
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePasswordHandler(
    @Body() dto: ChangePasswordDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<void> {
    await this.changePassword.execute({
      adminUserId: this.resolveAdminUserId(actor),
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      actor,
    });
  }

  @Public()
  @Post('request-password-reset')
  @ApiOkResponse({ type: PasswordResetResponseDto })
  async requestPasswordResetHandler(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<PasswordResetResponseDto> {
    const appConfig = this.configService.getOrThrow<AppConfig>('app');
    const result = await this.requestPasswordReset.execute({
      email: dto.email,
      revealToken: appConfig.nodeEnv !== 'production',
    });
    return PasswordResetResponseDto.create(result.resetToken);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPasswordHandler(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.resetPassword.execute({ token: dto.token, newPassword: dto.newPassword });
  }

  @ApiBearerAuth('access-token')
  @Get('sessions')
  @ApiOkResponse({ type: SessionResponseDto, isArray: true })
  async listSessionsHandler(@CurrentActor() actor: ActorRef): Promise<SessionResponseDto[]> {
    const sessions = await this.listSessions.execute({
      adminUserId: this.resolveAdminUserId(actor),
    });
    return sessions.map((session) => SessionResponseDto.fromDomain(session));
  }

  @ApiBearerAuth('access-token')
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSessionHandler(
    @Param('id') id: string,
    @CurrentActor() actor: ActorRef,
  ): Promise<void> {
    await this.revokeSession.execute({
      adminUserId: this.resolveAdminUserId(actor),
      sessionId: id,
    });
  }

  @ApiBearerAuth('access-token')
  @Get('login-history')
  @ApiOkResponse({ type: LoginHistoryResponseDto, isArray: true })
  async loginHistoryHandler(@CurrentActor() actor: ActorRef): Promise<LoginHistoryResponseDto[]> {
    const entries = await this.listLoginHistory.execute({
      adminUserId: this.resolveAdminUserId(actor),
    });
    return entries.map((entry) => LoginHistoryResponseDto.fromDomain(entry));
  }
}
