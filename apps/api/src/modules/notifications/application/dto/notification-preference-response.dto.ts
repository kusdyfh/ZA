import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString } from 'class-validator';
import type { NotificationPreferenceRecord } from '../../../../infrastructure/notifications/notification-preference.repository';
import { NOTIFICATION_TYPES } from '../../domain/notification-types';

export class NotificationPreferenceResponseDto {
  @ApiProperty() type!: string;
  @ApiProperty() channel!: string;
  @ApiProperty() enabled!: boolean;

  static fromRecord(this: void, record: NotificationPreferenceRecord): NotificationPreferenceResponseDto {
    const dto = new NotificationPreferenceResponseDto();
    dto.type = record.type;
    dto.channel = record.channel;
    dto.enabled = record.enabled;
    return dto;
  }
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: Object.values(NOTIFICATION_TYPES) })
  @IsIn(Object.values(NOTIFICATION_TYPES))
  type!: string;

  @ApiProperty({ enum: ['EMAIL'] })
  @IsString()
  channel!: 'EMAIL';

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
