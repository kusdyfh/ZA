export interface VariantStockProps {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
  lowStockThreshold: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The stock ledger's current-value row — see docs/v2/adr/0014. Its
 * `quantity` is intentionally read-only from this entity's public API:
 * the only code path allowed to change it is
 * `VariantStockRepository.applyMovement()`, which writes the new
 * quantity and the corresponding `StockMovement` row together, in one
 * transaction. There is deliberately no `setQuantity()` here — that
 * would be a second, ungoverned path to change stock, which
 * docs/product/06-INVENTORY.md's audit-trail requirement forbids.
 */
export class VariantStock {
  private constructor(private props: VariantStockProps) {}

  static reconstitute(props: VariantStockProps): VariantStock {
    return new VariantStock(props);
  }

  setLowStockThreshold(threshold: number | null): void {
    this.props.lowStockThreshold = threshold;
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

  get quantity(): number {
    return this.props.quantity;
  }

  get lowStockThreshold(): number | null {
    return this.props.lowStockThreshold;
  }

  toProps(): VariantStockProps {
    return { ...this.props };
  }
}
