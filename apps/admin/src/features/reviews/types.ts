export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface Review {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  body: string | null;
  status: ReviewStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
