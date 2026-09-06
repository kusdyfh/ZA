import type { Money } from '../value-objects/money.vo';
import { InvalidNameError } from '../errors/catalog.errors';

export interface ProductVariantProps {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  colorId: string | null;
  sizeId: string | null;
  priceOverride: Money | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The sellable unit — see docs/product/03-PRODUCTS.md. Deliberately has
 * no stock field (Inventory is out of this epic's scope, same as Epic
 * 3A). Uniqueness of the (color, size) combination per product and SKU/
 * barcode uniqueness are both cross-row concerns, so they're validated by
 * `ProductPolicy`/the repository, not this entity — this entity only
 * owns its own fields.
 */
export class ProductVariant {
  private constructor(private props: ProductVariantProps) {}

  static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  static validateSku(sku: string): string {
    const trimmed = sku.trim();
    if (!trimmed) {
      throw new InvalidNameError('Variant SKU');
    }
    return trimmed;
  }

  changeSku(sku: string): void {
    this.props.sku = ProductVariant.validateSku(sku);
  }

  changeBarcode(barcode: string | null): void {
    const trimmed = barcode?.trim() ?? null;
    this.props.barcode = trimmed && trimmed.length > 0 ? trimmed : null;
  }

  changeAttributes(colorId: string | null, sizeId: string | null): void {
    this.props.colorId = colorId;
    this.props.sizeId = sizeId;
  }

  changePriceOverride(priceOverride: Money | null): void {
    this.props.priceOverride = priceOverride;
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get barcode(): string | null {
    return this.props.barcode;
  }

  get colorId(): string | null {
    return this.props.colorId;
  }

  get sizeId(): string | null {
    return this.props.sizeId;
  }

  get priceOverride(): Money | null {
    return this.props.priceOverride;
  }

  toProps(): ProductVariantProps {
    return { ...this.props };
  }
}
