import { SubmitReviewUseCase } from './submit-review.use-case';
import type { ReviewRepository } from '../../domain/repositories/review.repository';
import type { ProductRepository } from '../../../catalog/domain/repositories/product.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Review } from '../../domain/entities/review.entity';
import { REVIEW_STATUS } from '../../domain/constants/review-status.constants';
import { ProductNotFoundError } from '../../../catalog/domain/errors/catalog.errors';
import { InvalidReviewError } from '../../domain/errors/customer.errors';
import type { Product } from '../../../catalog/domain/entities/product.entity';

function buildReview(overrides: Partial<{ status: string }> = {}): Review {
  return Review.reconstitute({
    id: 'review-1',
    customerId: 'customer-1',
    productId: 'product-1',
    rating: 3,
    body: 'Ok.',
    status: (overrides.status ?? REVIEW_STATUS.APPROVED) as never,
    moderatedByActorId: null,
    moderatedByActorType: null,
    moderatedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SubmitReviewUseCase', () => {
  let reviews: jest.Mocked<ReviewRepository>;
  let products: jest.Mocked<ProductRepository>;
  let storeContext: StoreContext;
  let useCase: SubmitReviewUseCase;

  const input = { customerId: 'customer-1', productId: 'product-1', rating: 5, body: 'Great!' };

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
    products = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySku: jest.fn(),
      findManyByIds: jest.fn(),
      list: jest.fn(),
      replaceTags: jest.fn(),
      listTagIds: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new SubmitReviewUseCase(reviews, products, storeContext);
  });

  it('creates a new review when none exists yet', async () => {
    products.findById.mockResolvedValue({} as Product);
    reviews.findByCustomerAndProduct.mockResolvedValue(null);
    reviews.create.mockResolvedValue(buildReview({ status: REVIEW_STATUS.PENDING }));

    await useCase.execute(input);

    expect(reviews.create).toHaveBeenCalledWith({
      customerId: 'customer-1',
      productId: 'product-1',
      rating: 5,
      body: 'Great!',
    });
  });

  it('edits the existing review in place instead of creating a duplicate', async () => {
    products.findById.mockResolvedValue({} as Product);
    const existing = buildReview({ status: REVIEW_STATUS.APPROVED });
    reviews.findByCustomerAndProduct.mockResolvedValue(existing);

    const result = await useCase.execute(input);

    expect(reviews.create).not.toHaveBeenCalled();
    expect(reviews.save).toHaveBeenCalledWith(existing);
    expect(result.rating).toBe(5);
    expect(result.status).toBe(REVIEW_STATUS.PENDING);
  });

  it('throws ProductNotFoundError for an unknown product', async () => {
    products.findById.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(ProductNotFoundError);
  });

  it('rejects an invalid rating', async () => {
    products.findById.mockResolvedValue({} as Product);
    await expect(useCase.execute({ ...input, rating: 0 })).rejects.toThrow(InvalidReviewError);
  });
});
