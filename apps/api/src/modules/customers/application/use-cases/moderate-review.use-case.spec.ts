import { ActorType } from '@za/types';
import { ModerateReviewUseCase } from './moderate-review.use-case';
import type { ReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';
import { REVIEW_STATUS } from '../../domain/constants/review-status.constants';
import { ReviewNotFoundError } from '../../domain/errors/customer.errors';

const adminActor = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildPendingReview(): Review {
  return Review.reconstitute({
    id: 'review-1',
    customerId: 'customer-1',
    productId: 'product-1',
    rating: 4,
    body: 'Ok.',
    status: REVIEW_STATUS.PENDING,
    moderatedByActorId: null,
    moderatedByActorType: null,
    moderatedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ModerateReviewUseCase', () => {
  let reviews: jest.Mocked<ReviewRepository>;
  let useCase: ModerateReviewUseCase;

  beforeEach(() => {
    reviews = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerAndProduct: jest.fn(),
      save: jest.fn(),
      listByProductId: jest.fn(),
      listByStatus: jest.fn(),
      getSummary: jest.fn(),
    };
    useCase = new ModerateReviewUseCase(reviews);
  });

  it('approves a pending review', async () => {
    const review = buildPendingReview();
    reviews.findById.mockResolvedValue(review);

    const result = await useCase.execute({ reviewId: 'review-1', approve: true, actor: adminActor });

    expect(result.status).toBe(REVIEW_STATUS.APPROVED);
    expect(reviews.save).toHaveBeenCalledWith(review);
  });

  it('rejects a pending review with a reason', async () => {
    const review = buildPendingReview();
    reviews.findById.mockResolvedValue(review);

    const result = await useCase.execute({
      reviewId: 'review-1',
      approve: false,
      rejectionReason: 'Spam.',
      actor: adminActor,
    });

    expect(result.status).toBe(REVIEW_STATUS.REJECTED);
    expect(result.rejectionReason).toBe('Spam.');
  });

  it('throws ReviewNotFoundError for an unknown review', async () => {
    reviews.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ reviewId: 'missing', approve: true, actor: adminActor }),
    ).rejects.toThrow(ReviewNotFoundError);
  });
});
