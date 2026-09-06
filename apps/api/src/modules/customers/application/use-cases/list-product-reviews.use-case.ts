import { Inject, Injectable } from '@nestjs/common';
import type { Review } from '../../domain/entities/review.entity';
import {
  REVIEW_REPOSITORY,
  type ProductReviewSummary,
  type ReviewRepository,
} from '../../domain/repositories/review.repository';
import { REVIEW_STATUS } from '../../domain/constants/review-status.constants';

export interface ListProductReviewsInput {
  productId: string;
}

export interface ListProductReviewsResult {
  reviews: Review[];
  summary: ProductReviewSummary;
}

/** Public — only ever returns APPROVED reviews (docs/product/13-REVIEWS.md: "nothing customer-submitted goes live automatically"). */
@Injectable()
export class ListProductReviewsUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository) {}

  async execute(input: ListProductReviewsInput): Promise<ListProductReviewsResult> {
    const [reviews, summary] = await Promise.all([
      this.reviews.listByProductId(input.productId, REVIEW_STATUS.APPROVED),
      this.reviews.getSummary(input.productId),
    ]);
    return { reviews, summary };
  }
}
