import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ActorType, type ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { GetNotificationPreferencesUseCase } from '../application/use-cases/get-notification-preferences.use-case';
import { SetNotificationPreferenceUseCase } from '../application/use-cases/set-notification-preference.use-case';
import {
  NotificationPreferenceResponseDto,
  UpdateNotificationPreferenceDto,
} from '../application/dto/notification-preference-response.dto';

/**
 * Staff-side preferences — who receives admin alerts (new order, review
 * awaiting moderation), and whether at all (ADR 0024 §"Preferences
 * ownership"). Reuses `SETTINGS_MANAGE`: this is store-wide notification
 * configuration, the same spirit as every other setting that permission
 * already gates.
 */
@ApiTags('Notifications — Preferences (Staff)')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
@Controller('notifications/preferences')
export class NotificationPreferencesController {
  constructor(
    private readonly getPreferences: GetNotificationPreferencesUseCase,
    private readonly setPreference: SetNotificationPreferenceUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: NotificationPreferenceResponseDto, isArray: true })
  async get(@CurrentActor() actor: ActorRef): Promise<NotificationPreferenceResponseDto[]> {
    const records = await this.getPreferences.execute({ ownerType: ActorType.ADMIN, ownerId: actor.actorId! });
    return records.map(NotificationPreferenceResponseDto.fromRecord);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Body() dto: UpdateNotificationPreferenceDto, @CurrentActor() actor: ActorRef): Promise<void> {
    await this.setPreference.execute({
      ownerType: ActorType.ADMIN,
      ownerId: actor.actorId!,
      type: dto.type,
      channel: dto.channel,
      enabled: dto.enabled,
    });
  }
}
