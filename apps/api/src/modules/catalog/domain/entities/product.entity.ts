import type { Slug } from '../value-objects/slug.vo';
import type { Money } from '../value-objects/money.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { PRODUCT_STATUS, type ProductStatusValue } from '../constants/product-status.constants';
import { ProductPolicy } from '../policies/product-policy';

export interface ProductProps {
  id: string;
  storeId: string;
  name: string;
  slug: Slug;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatusValue;
  price: Money;
  discountPrice: Money | null;
  categoryId: string;
  brandId: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isGiftBox: boolean;
  seo: SeoMetadata;
  /** Ordered bullet points — see docs/epics/EPIC-03B "Product Highlights". */
  highlights: string[];
  /** Long-form HTML content — see docs/epics/EPIC-03B "Rich Content". */
  richContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchandisingFlags {
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isGiftBox?: boolean;
}

/**
 * The catalog's core aggregate — see docs/product/03-PRODUCTS.md. This
 * entity performs mutations and whatever validation needs only its own
 * fields (pricing consistency, non-empty name/SKU). Every other product
 * business rule — including the "≥1 variant, ≥1 cover image" gate before
 * a transition to ACTIVE — is centralized in `ProductPolicy`
 * (`domain/policies/product-policy.ts`), not here, per this epic's
 * explicit instruction to keep all product business rules in one place.
 * `changeStatus()` performs the raw transition only; `ProductPolicy`'s
 * gate must be asserted by the caller (`ChangeProductStatusUseCase`)
 * first.
 */
export class Product {
  private constructor(private props: ProductProps) {}

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  rename(name: string): void {
    this.props.name = ProductPolicy.validateName(name);
  }

  changeSlug(slug: Slug): void {
    this.props.slug = slug;
  }

  changeSku(sku: string): void {
    this.props.sku = ProductPolicy.validateSku(sku);
  }

  updateDescriptions(shortDescription: string | null, description: string | null): void {
    this.props.shortDescription = shortDescription;
    this.props.description = description;
  }

  updatePricing(price: Money, discountPrice: Money | null): void {
    ProductPolicy.validatePricing(price, discountPrice);
    this.props.price = price;
    this.props.discountPrice = discountPrice;
  }

  updateHighlights(highlights: string[]): void {
    this.props.highlights = highlights.map((h) => h.trim()).filter((h) => h.length > 0);
  }

  updateRichContent(richContent: string | null): void {
    this.props.richContent = richContent && richContent.trim().length > 0 ? richContent : null;
  }

  assignCategory(categoryId: string): void {
    this.props.categoryId = categoryId;
  }

  assignBrand(brandId: string | null): void {
    this.props.brandId = brandId;
  }

  setMerchandisingFlags(flags: MerchandisingFlags): void {
    if (flags.isFeatured !== undefined) this.props.isFeatured = flags.isFeatured;
    if (flags.isBestSeller !== undefined) this.props.isBestSeller = flags.isBestSeller;
    if (flags.isNewArrival !== undefined) this.props.isNewArrival = flags.isNewArrival;
    if (flags.isGiftBox !== undefined) this.props.isGiftBox = flags.isGiftBox;
  }

  updateSeo(seo: SeoMetadata): void {
    this.props.seo = seo;
  }

  changeStatus(status: ProductStatusValue): void {
    this.props.status = status;
  }

  /**
   * "Product Visibility" — for this epoch, visibility is determined
   * solely by status. The full rule from docs/product/03-PRODUCTS.md
   * ("an Active product with every variant at zero stock is still shown,
   * marked Sold Out") needs Inventory, out of this epic's scope.
   */
  isVisibleInCatalog(): boolean {
    return this.props.status === PRODUCT_STATUS.ACTIVE;
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get sku(): string {
    return this.props.sku;
  }

  get shortDescription(): string | null {
    return this.props.shortDescription;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): ProductStatusValue {
    return this.props.status;
  }

  get price(): Money {
    return this.props.price;
  }

  get discountPrice(): Money | null {
    return this.props.discountPrice;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get brandId(): string | null {
    return this.props.brandId;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get isBestSeller(): boolean {
    return this.props.isBestSeller;
  }

  get isNewArrival(): boolean {
    return this.props.isNewArrival;
  }

  get isGiftBox(): boolean {
    return this.props.isGiftBox;
  }

  get seo(): SeoMetadata {
    return this.props.seo;
  }

  get highlights(): string[] {
    return [...this.props.highlights];
  }

  get richContent(): string | null {
    return this.props.richContent;
  }

  toProps(): ProductProps {
    return { ...this.props };
  }
}
