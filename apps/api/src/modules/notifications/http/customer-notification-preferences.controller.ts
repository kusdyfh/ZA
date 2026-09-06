import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ActorType, type ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { GetNotificationPreferencesUseCase } from '../application/use-cases/get-notification-preferences.use-case';
import { SetNotificationPreferenceUseCase } from '../application/use-cases/set-notification-preference.use-case';
import {
  NotificationPreferenceResponseDto,
  UpdateNotificationPreferenceDto,
} from '../application/dto/notification-preference-response.dto';

/** Customer-side preferences (ADR 0024) — additive to `CustomerProfileController`'s `customers/me` surface, guarded the same way. */
@ApiTags('Customers — Notification Preferences')
@Public()
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth('customer-access-token')
@Controller('customers/me/notification-preferences')
export class CustomerNotificationPreferencesController {
  constructor(
    private readonly getPreferences: GetNotificationPreferencesUseCase,
    private readonly setPreference: SetNotificationPreferenceUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: NotificationPreferenceResponseDto, isArray: true })
  async get(@CurrentActor() actor: ActorRef): Promise<NotificationPreferenceResponseDto[]> {
    const records = await this.getPreferences.execute({ ownerType: ActorType.CUSTOMER, ownerId: actor.actorId! });
    return records.map(NotificationPreferenceResponseDto.fromRecord);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Body() dto: UpdateNotificationPreferenceDto, @CurrentActor() actor: ActorRef): Promise<void> {
    await this.setPreference.execute({
      ownerType: ActorType.CUSTOMER,
      ownerId: actor.actorId!,
      type: dto.type,
      channel: dto.channel,
      enabled: dto.enabled,
    });
  }
}
