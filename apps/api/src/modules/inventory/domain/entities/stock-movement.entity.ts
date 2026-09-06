import type { ActorType } from '@za/types';
import type { StockMovementTypeValue } from '../constants/stock-movement-type.constants';
import type { StockAdjustmentReasonValue } from '../constants/stock-adjustment-reason.constants';

export interface StockMovementProps {
  id: string;
  variantId: string;
  warehouseId: string;
  type: StockMovementTypeValue;
  quantity: number;
  resultingStock: number;
  reason: StockAdjustmentReasonValue | null;
  note: string | null;
  actorId: string | null;
  actorType: ActorType;
  createdAt: Date;
}

/**
 * Immutable — see docs/product/06-INVENTORY.md's audit-trail
 * requirement. Deliberately has no mutator methods of any kind; a
 * `StockMovement` row, once written, is never edited — only ever
 * created (via `VariantStockRepository.applyMovement`) or read.
 */
export class StockMovement {
  private constructor(private readonly props: StockMovementProps) {}

  static reconstitute(props: StockMovementProps): StockMovement {
    return new StockMovement(props);
  }

  get id(): string {
    return this.props.id;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get warehouseId(): string {
    return this.props.warehouseId;
  }

  get type(): StockMovementTypeValue {
    return this.props.type;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get resultingStock(): number {
    return this.props.resultingStock;
  }

  get reason(): StockAdjustmentReasonValue | null {
    return this.props.reason;
  }

  get note(): string | null {
    return this.props.note;
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

  toProps(): StockMovementProps {
    return { ...this.props };
  }
}
