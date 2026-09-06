import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { ListNotificationsUseCase } from '../application/use-cases/list-notifications.use-case';
import { NotificationResponseDto } from '../application/dto/notification-response.dto';

/** Staff-only (ADR 0024) — reuses `AUDIT_LOG_VIEW`, an operational log in the same spirit as the audit log. */
@ApiTags('Notifications — History')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.AUDIT_LOG_VIEW)
@Controller('notifications')
export class NotificationHistoryController {
  constructor(private readonly listNotifications: ListNotificationsUseCase) {}

  @Get()
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  async list(): Promise<NotificationResponseDto[]> {
    const records = await this.listNotifications.execute();
    return records.map(NotificationResponseDto.fromRecord);
  }
}
