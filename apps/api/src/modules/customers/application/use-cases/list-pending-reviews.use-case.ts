import { Inject, Injectable } from '@nestjs/common';
import type { Review } from '../../domain/entities/review.entity';
import { REVIEW_REPOSITORY, type ReviewRepository } from '../../domain/repositories/review.repository';
import { REVIEW_STATUS } from '../../domain/constants/review-status.constants';

/** Staff moderation queue — guarded by REVIEWS_MODERATE (Epic 2, first used here). */
@Injectable()
export class ListPendingReviewsUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository) {}

  async execute(): Promise<Review[]> {
    return this.reviews.listByStatus(REVIEW_STATUS.PENDING);
  }
}
