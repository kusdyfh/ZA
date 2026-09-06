import type { Review } from '../entities/review.entity';
import type { ReviewStatusValue } from '../constants/review-status.constants';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface CreateReviewData {
  customerId: string;
  productId: string;
  rating: number;
  body: string | null;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface ReviewRepository {
  create(data: CreateReviewData): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findByCustomerAndProduct(customerId: string, productId: string): Promise<Review | null>;
  save(review: Review): Promise<void>;
  listByProductId(productId: string, status?: ReviewStatusValue): Promise<Review[]>;
  listByStatus(status: ReviewStatusValue): Promise<Review[]>;
  /** APPROVED-only, per docs/product/13-REVIEWS.md FR-3 — computed live, never stored on Product (ADR 0018 §6). */
  getSummary(productId: string): Promise<ProductReviewSummary>;
}
