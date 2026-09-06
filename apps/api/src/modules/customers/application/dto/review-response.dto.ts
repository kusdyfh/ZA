import type { Review } from '../../domain/entities/review.entity';

export class ReviewResponseDto {
  id!: string;
  customerId!: string;
  productId!: string;
  rating!: number;
  body!: string | null;
  status!: string;
  rejectionReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = review.id;
    dto.customerId = review.customerId;
    dto.productId = review.productId;
    dto.rating = review.rating;
    dto.body = review.body;
    dto.status = review.status;
    dto.rejectionReason = review.rejectionReason;
    dto.createdAt = review.createdAt;
    dto.updatedAt = review.updatedAt;
    return dto;
  }
}
