import { ActorType } from '@za/types';
import { Review, type ReviewProps } from './review.entity';
import { REVIEW_STATUS } from '../constants/review-status.constants';
import { ReviewAlreadyModeratedError } from '../errors/customer.errors';

const adminActor = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildReview(overrides: Partial<ReviewProps> = {}): Review {
  const props: ReviewProps = {
    id: 'review-1',
    customerId: 'customer-1',
    productId: 'product-1',
    rating: 4,
    body: 'Pretty good.',
    status: REVIEW_STATUS.PENDING,
    moderatedByActorId: null,
    moderatedByActorType: null,
    moderatedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Review.reconstitute(props);
}

describe('Review#approve', () => {
  it('marks the review approved and records the moderator', () => {
    const review = buildReview();
    review.approve(adminActor);

    expect(review.status).toBe(REVIEW_STATUS.APPROVED);
    expect(review.toProps().moderatedByActorId).toBe('admin-1');
    expect(review.toProps().moderatedAt).not.toBeNull();
  });

  it('throws when the review was already moderated', () => {
    const review = buildReview({ status: REVIEW_STATUS.APPROVED });
    expect(() => review.approve(adminActor)).toThrow(ReviewAlreadyModeratedError);
  });
});

describe('Review#reject', () => {
  it('marks the review rejected with a reason', () => {
    const review = buildReview();
    review.reject(adminActor, 'Inappropriate language.');

    expect(review.status).toBe(REVIEW_STATUS.REJECTED);
    expect(review.rejectionReason).toBe('Inappropriate language.');
  });

  it('throws when the review was already moderated', () => {
    const review = buildReview({ status: REVIEW_STATUS.REJECTED });
    expect(() => review.reject(adminActor, null)).toThrow(ReviewAlreadyModeratedError);
  });
});

describe('Review#edit', () => {
  it('updates rating/body and resets to PENDING, clearing prior moderation', () => {
    const review = buildReview({
      status: REVIEW_STATUS.APPROVED,
      moderatedByActorId: 'admin-1',
      moderatedByActorType: ActorType.ADMIN,
      moderatedAt: new Date(),
    });

    review.edit(2, 'Changed my mind.');

    expect(review.rating).toBe(2);
    expect(review.body).toBe('Changed my mind.');
    expect(review.status).toBe(REVIEW_STATUS.PENDING);
    expect(review.toProps().moderatedByActorId).toBeNull();
    expect(review.toProps().moderatedAt).toBeNull();
  });
});
