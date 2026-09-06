import type { ActorRef } from '@za/types';
import { ReviewAlreadyModeratedError } from '../errors/customer.errors';
import { REVIEW_STATUS, type ReviewStatusValue } from '../constants/review-status.constants';

export interface ReviewProps {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  body: string | null;
  status: ReviewStatusValue;
  moderatedByActorId: string | null;
  moderatedByActorType: ActorRef['actorType'] | null;
  moderatedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One review per (customer, product) — re-submitting edits the row in
 * place via `edit()` rather than creating a duplicate
 * (docs/product/13-REVIEWS.md). Every review starts `PENDING` and is
 * moderated exactly once into `APPROVED` or `REJECTED` — resolved one
 * way or the other, never left in limbo.
 */
export class Review {
  private constructor(private props: ReviewProps) {}

  static reconstitute(props: ReviewProps): Review {
    return new Review(props);
  }

  /** Editing an already-moderated review sends it back to PENDING — it's a new claim that needs re-moderation. */
  edit(rating: number, body: string | null): void {
    this.props.rating = rating;
    this.props.body = body;
    this.props.status = REVIEW_STATUS.PENDING;
    this.props.moderatedByActorId = null;
    this.props.moderatedByActorType = null;
    this.props.moderatedAt = null;
    this.props.rejectionReason = null;
    this.props.updatedAt = new Date();
  }

  approve(actor: ActorRef): void {
    this.assertNotAlreadyModerated();
    this.props.status = REVIEW_STATUS.APPROVED;
    this.recordModeration(actor);
  }

  reject(actor: ActorRef, reason: string | null): void {
    this.assertNotAlreadyModerated();
    this.props.status = REVIEW_STATUS.REJECTED;
    this.props.rejectionReason = reason;
    this.recordModeration(actor);
  }

  private assertNotAlreadyModerated(): void {
    if (this.props.status !== REVIEW_STATUS.PENDING) {
      throw new ReviewAlreadyModeratedError();
    }
  }

  private recordModeration(actor: ActorRef): void {
    this.props.moderatedByActorId = actor.actorId;
    this.props.moderatedByActorType = actor.actorType;
    this.props.moderatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get rating(): number {
    return this.props.rating;
  }

  get body(): string | null {
    return this.props.body;
  }

  get status(): ReviewStatusValue {
    return this.props.status;
  }

  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): ReviewProps {
    return { ...this.props };
  }
}
