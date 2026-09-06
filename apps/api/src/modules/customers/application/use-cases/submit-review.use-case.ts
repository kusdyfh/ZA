import { Inject, Injectable } from '@nestjs/common';
import type { Review } from '../../domain/entities/review.entity';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { REVIEW_REPOSITORY, type ReviewRepository } from '../../domain/repositories/review.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../catalog/domain/repositories/product.repository';
import { ProductNotFoundError } from '../../../catalog/domain/errors/catalog.errors';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface SubmitReviewInput {
  customerId: string;
  productId: string;
  rating: number;
  body?: string | null;
}

/**
 * Create-or-edit: a customer re-submitting for a product they've
 * already reviewed edits the existing row in place — per
 * docs/product/13-REVIEWS.md's "offered to edit their existing review
 * instead of creating a duplicate." Editing sends it back to PENDING
 * (Review.edit()) since it's a new claim needing fresh moderation.
 */
@Injectable()
export class SubmitReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SubmitReviewInput): Promise<Review> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const product = await this.products.findById(storeId, input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const body = input.body ?? null;
    CustomerPolicy.assertValidReview(input.rating, body);

    const existing = await this.reviews.findByCustomerAndProduct(input.customerId, input.productId);
    if (existing) {
      existing.edit(input.rating, body);
      await this.reviews.save(existing);
      return existing;
    }

    return this.reviews.create({
      customerId: input.customerId,
      productId: input.productId,
      rating: input.rating,
      body,
    });
  }
}
