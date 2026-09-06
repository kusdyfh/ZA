import type { Product } from '../entities/product.entity';
import type { Money } from '../value-objects/money.vo';
import { PRODUCT_MEDIA_TYPE, type ProductMediaTypeValue } from '../constants/product-media-type.constants';
import { PRODUCT_STATUS } from '../constants/product-status.constants';
import {
  CoverImageMustBeImageError,
  DiscountPriceNotLowerThanPriceError,
  DuplicateVariantAttributesError,
  ImageAltTextRequiredError,
  InvalidNameError,
  LastCoverImageOfActiveProductError,
  LastVariantOfActiveProductError,
  MultipleCoverImagesError,
  ProductNotReadyForActiveError,
} from '../errors/catalog.errors';

export interface ProductActiveReadiness {
  hasVariant: boolean;
  hasCoverImage: boolean;
}

export interface MediaEntryLike {
  type: ProductMediaTypeValue;
  altText: string | null;
  isCover: boolean;
}

export interface VariantAttributesLike {
  id: string;
  colorId: string | null;
  sizeId: string | null;
}

/**
 * The single home for every Product business rule, per this epic's
 * explicit instruction — "Centralize all product business rules inside
 * ProductPolicy." Nothing here talks to a repository or Prisma; every
 * method takes plain, already-loaded data and either returns a validated
 * value or throws. Use-cases are responsible for loading that data and
 * calling this policy before mutating anything; controllers never touch
 * this policy directly (there are no controllers in this codebase yet —
 * see IdentityModule/CatalogModule's doc comments).
 *
 * Supersedes Epic 3A's `ProductPublishReadinessService` — folded in here
 * rather than left as a separate class, since the whole point of this
 * epic's instruction is one policy, not one-policy-plus-a-leftover.
 */
export class ProductPolicy {
  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Product');
    }
    return trimmed;
  }

  static validateSku(sku: string): string {
    const trimmed = sku.trim();
    if (!trimmed) {
      throw new InvalidNameError('Product SKU');
    }
    return trimmed;
  }

  static validatePricing(price: Money, discountPrice: Money | null): void {
    if (discountPrice && !discountPrice.isLessThan(price)) {
      throw new DiscountPriceNotLowerThanPriceError();
    }
  }

  /**
   * The Active-status publish gate — docs/product/03-PRODUCTS.md's full
   * checklist also requires alt text on every image, which is enforced
   * separately and unconditionally by `validateMediaSet` (an image can
   * never exist without alt text in the first place, in any status), so
   * it isn't repeated here.
   */
  static assertReadyForActive(product: Product, readiness: ProductActiveReadiness): void {
    const reasons: string[] = [];

    if (!product.name.trim()) {
      reasons.push('name is required');
    }
    if (!product.sku.trim()) {
      reasons.push('SKU is required');
    }
    if (!product.categoryId) {
      reasons.push('a category is required');
    }
    if (!readiness.hasVariant) {
      reasons.push('at least one variant is required');
    }
    if (!readiness.hasCoverImage) {
      reasons.push('a cover image is required');
    }

    if (reasons.length > 0) {
      throw new ProductNotReadyForActiveError(reasons);
    }
  }

  /**
   * Validates a full proposed media set before it replaces a product's
   * current media (SetProductMediaUseCase) — at most one cover, the
   * cover must be an image, and every image has non-empty alt text.
   */
  static validateMediaSet(media: MediaEntryLike[]): void {
    const coverCount = media.filter((item) => item.isCover).length;
    if (coverCount > 1) {
      throw new MultipleCoverImagesError();
    }

    for (const item of media) {
      if (item.isCover && item.type !== PRODUCT_MEDIA_TYPE.IMAGE) {
        throw new CoverImageMustBeImageError();
      }
      if (item.type === PRODUCT_MEDIA_TYPE.IMAGE && !item.altText?.trim()) {
        throw new ImageAltTextRequiredError();
      }
    }
  }

  /**
   * Blocks removing a product's last variant while it is Active, so an
   * Active product can never silently regress out of the "≥1 variant"
   * invariant `assertReadyForActive` enforces at the transition boundary.
   */
  static assertVariantRemovable(product: Product, remainingVariantCountAfterRemoval: number): void {
    if (product.status === PRODUCT_STATUS.ACTIVE && remainingVariantCountAfterRemoval < 1) {
      throw new LastVariantOfActiveProductError();
    }
  }

  /** Same reasoning as `assertVariantRemovable`, for the cover image. */
  static assertActiveProductKeepsCoverImage(product: Product, proposedMedia: MediaEntryLike[]): void {
    if (product.status === PRODUCT_STATUS.ACTIVE && !proposedMedia.some((item) => item.isCover)) {
      throw new LastCoverImageOfActiveProductError();
    }
  }

  /** Blocks two variants of the same product sharing the same color+size combination. */
  static assertNoDuplicateVariantAttributes(
    existingVariants: VariantAttributesLike[],
    candidate: { colorId: string | null; sizeId: string | null },
    excludeVariantId?: string,
  ): void {
    const duplicate = existingVariants.some(
      (variant) =>
        variant.id !== excludeVariantId &&
        variant.colorId === candidate.colorId &&
        variant.sizeId === candidate.sizeId,
    );
    if (duplicate) {
      throw new DuplicateVariantAttributesError();
    }
  }
}
