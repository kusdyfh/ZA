import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import type { Review } from '../../domain/entities/review.entity';
import { ReviewNotFoundError } from '../../domain/errors/customer.errors';
import { REVIEW_REPOSITORY, type ReviewRepository } from '../../domain/repositories/review.repository';

export interface ModerateReviewInput {
  reviewId: string;
  approve: boolean;
  rejectionReason?: string | null;
  actor: ActorRef;
}

/** Resolved one way or the other — approve or reject, never left in limbo (docs/product/13-REVIEWS.md). */
@Injectable()
export class ModerateReviewUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository) {}

  async execute(input: ModerateReviewInput): Promise<Review> {
    const review = await this.reviews.findById(input.reviewId);
    if (!review) {
      throw new ReviewNotFoundError(input.reviewId);
    }

    if (input.approve) {
      review.approve(input.actor);
    } else {
      review.reject(input.actor, input.rejectionReason ?? null);
    }
    await this.reviews.save(review);
    return review;
  }
}
