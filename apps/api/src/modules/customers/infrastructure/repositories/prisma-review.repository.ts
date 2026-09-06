import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Review } from '../../domain/entities/review.entity';
import type {
  CreateReviewData,
  ProductReviewSummary,
  ReviewRepository,
} from '../../domain/repositories/review.repository';
import { REVIEW_STATUS, type ReviewStatusValue } from '../../domain/constants/review-status.constants';
import { ReviewMapper } from '../mappers/review.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
  ) {}

  /**
   * Wrapped in `$transaction` so `ReviewSubmitted` commits in the same
   * transaction as the row itself (ADR 0002/0023). `Review` has no
   * `storeId` column of its own (scoped indirectly via `productId`), so
   * the product's `storeId`/`name` are read once here — needed for the
   * outbox payload anyway (the moderation-alert email names the product).
   */
  async create(data: CreateReviewData): Promise<Review> {
    const record = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: data.productId },
        select: { storeId: true, name: true },
      });

      const created = await tx.review.create({
        data: {
          customerId: data.customerId,
          productId: data.productId,
          rating: data.rating,
          body: data.body,
        },
      });

      await this.outbox.writeInTransaction(tx, {
        storeId: product.storeId,
        eventType: EVENT_TYPES.REVIEW_SUBMITTED,
        aggregateId: created.id,
        aggregateType: 'Review',
        payload: { reviewId: created.id, productId: data.productId, productName: product.name, rating: created.rating },
      });

      return created;
    });
    return ReviewMapper.toDomain(record);
  }

  async findById(id: string): Promise<Review | null> {
    const record = await this.prisma.review.findUnique({ where: { id } });
    return record ? ReviewMapper.toDomain(record) : null;
  }

  async findByCustomerAndProduct(customerId: string, productId: string): Promise<Review | null> {
    const record = await this.prisma.review.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    return record ? ReviewMapper.toDomain(record) : null;
  }

  async save(review: Review): Promise<void> {
    const props = review.toProps();
    await this.prisma.review.update({
      where: { id: props.id },
      data: {
        rating: props.rating,
        body: props.body,
        status: props.status,
        moderatedByActorId: props.moderatedByActorId,
        moderatedByActorType: props.moderatedByActorType,
        moderatedAt: props.moderatedAt,
        rejectionReason: props.rejectionReason,
      },
    });
  }

  async listByProductId(productId: string, status?: ReviewStatusValue): Promise<Review[]> {
    const records = await this.prisma.review.findMany({
      where: { productId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(ReviewMapper.toDomain);
  }

  async listByStatus(status: ReviewStatusValue): Promise<Review[]> {
    const records = await this.prisma.review.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(ReviewMapper.toDomain);
  }

  async getSummary(productId: string): Promise<ProductReviewSummary> {
    const result = await this.prisma.review.aggregate({
      where: { productId, status: REVIEW_STATUS.APPROVED },
      _avg: { rating: true },
      _count: true,
    });
    return {
      averageRating: result._avg.rating ?? 0,
      reviewCount: result._count,
    };
  }
}
