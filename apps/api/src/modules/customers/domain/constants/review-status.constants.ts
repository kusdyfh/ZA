/** Per docs/product/13-REVIEWS.md's moderation lifecycle. */
export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ReviewStatusValue = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
