import { ApiProperty } from '@nestjs/swagger';
import type { ActorType } from '@za/types';
import type { NotificationRecord } from '../../../../infrastructure/notifications/notification.repository';

export class NotificationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() channel!: string;
  @ApiProperty() recipientType!: ActorType;
  @ApiProperty({ nullable: true }) recipientId!: string | null;
  @ApiProperty({ nullable: true }) recipientEmail!: string | null;
  @ApiProperty() subject!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) sentAt!: string | null;
  @ApiProperty({ nullable: true }) error!: string | null;
  @ApiProperty() createdAt!: string;

  static fromRecord(this: void, record: NotificationRecord): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = record.id;
    dto.type = record.type;
    dto.channel = record.channel;
    dto.recipientType = record.recipientType;
    dto.recipientId = record.recipientId ?? null;
    dto.recipientEmail = record.recipientEmail ?? null;
    dto.subject = record.subject;
    dto.status = record.status;
    dto.sentAt = record.sentAt ? record.sentAt.toISOString() : null;
    dto.error = record.error;
    dto.createdAt = record.createdAt.toISOString();
    return dto;
  }
}
