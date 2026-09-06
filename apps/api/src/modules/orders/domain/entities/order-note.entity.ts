import type { ActorType } from '@za/types';

export interface OrderNoteProps {
  id: string;
  body: string;
  isInternal: boolean;
  actorId: string | null;
  actorType: ActorType;
  createdAt: Date;
}

/** `isInternal = true`: staff-only. `isInternal = false`: customer-visible. */
export class OrderNote {
  private constructor(private readonly props: OrderNoteProps) {}

  static reconstitute(props: OrderNoteProps): OrderNote {
    return new OrderNote(props);
  }

  get id(): string {
    return this.props.id;
  }

  get body(): string {
    return this.props.body;
  }

  get isInternal(): boolean {
    return this.props.isInternal;
  }

  get actorId(): string | null {
    return this.props.actorId;
  }

  get actorType(): ActorType {
    return this.props.actorType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toProps(): OrderNoteProps {
    return { ...this.props };
  }
}
