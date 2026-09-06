import type { Refund } from '../../domain/entities/refund.entity';

export class RefundResponseDto {
  id!: string;
  orderId!: string;
  amount!: number;
  reason!: string;
  status!: string;
  method!: string;
  completedAt!: Date | null;
  createdAt!: Date;

  static fromDomain(this: void, refund: Refund): RefundResponseDto {
    const dto = new RefundResponseDto();
    dto.id = refund.id;
    dto.orderId = refund.orderId;
    dto.amount = refund.amount;
    dto.reason = refund.reason;
    dto.status = refund.status;
    dto.method = refund.method;
    dto.completedAt = refund.completedAt;
    dto.createdAt = refund.createdAt;
    return dto;
  }
}
