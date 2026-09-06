import type { Review as ReviewRecord } from '@prisma/client';
import type { ActorType } from '@za/types';
import { Review } from '../../domain/entities/review.entity';

export class ReviewMapper {
  static toDomain(this: void, record: ReviewRecord): Review {
    return Review.reconstitute({
      id: record.id,
      customerId: record.customerId,
      productId: record.productId,
      rating: record.rating,
      body: record.body,
      status: record.status,
      moderatedByActorId: record.moderatedByActorId,
      moderatedByActorType: record.moderatedByActorType as ActorType | null,
      moderatedAt: record.moderatedAt,
      rejectionReason: record.rejectionReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
