import { DomainError } from '../../../../shared/errors/domain-error';

export class InvalidNameError extends DomainError {
  readonly code = 'INVALID_NAME';
  constructor(entity: string) {
    super(`${entity} name must not be empty.`);
  }
}

export class InvalidSlugError extends DomainError {
  readonly code = 'INVALID_SLUG';
  constructor(value: string) {
    super(`"${value}" is not a valid slug (lowercase letters, numbers, and single hyphens only).`);
  }
}

export class SlugAlreadyInUseError extends DomainError {
  readonly code = 'SLUG_ALREADY_IN_USE';
  constructor(slug: string) {
    super(`The slug "${slug}" is already in use.`);
  }
}

export class SkuAlreadyInUseError extends DomainError {
  readonly code = 'SKU_ALREADY_IN_USE';
  constructor(sku: string) {
    super(`The SKU "${sku}" is already in use.`);
  }
}

export class InvalidMoneyAmountError extends DomainError {
  readonly code = 'INVALID_MONEY_AMOUNT';
  constructor(value: string) {
    super(`"${value}" is not a valid money amount — it must be zero or greater.`);
  }
}

export class CurrencyMismatchError extends DomainError {
  readonly code = 'CURRENCY_MISMATCH';
  constructor(a: string, b: string) {
    super(`Cannot compare amounts in different currencies ("${a}" vs "${b}").`);
  }
}

export class DiscountPriceNotLowerThanPriceError extends DomainError {
  readonly code = 'DISCOUNT_PRICE_NOT_LOWER_THAN_PRICE';
  constructor() {
    super('Discount price must be lower than the base price.');
  }
}

export class InvalidDateRangeError extends DomainError {
  readonly code = 'INVALID_DATE_RANGE';
  constructor() {
    super('End date must be after the start date.');
  }
}

export class CategoryDepthExceededError extends DomainError {
  readonly code = 'CATEGORY_DEPTH_EXCEEDED';
  constructor() {
    super('Categories can be nested at most 3 levels deep.');
  }
}

export class CategoryCycleError extends DomainError {
  readonly code = 'CATEGORY_CYCLE';
  constructor() {
    super('A category cannot be made its own parent or descendant.');
  }
}

export class CategoryNotEmptyError extends DomainError {
  readonly code = 'CATEGORY_NOT_EMPTY';
  constructor() {
    super('This category still has subcategories or products — reassign or remove them first.');
  }
}

export class ProductNotReadyForActiveError extends DomainError {
  readonly code = 'PRODUCT_NOT_READY_FOR_ACTIVE';
  constructor(reasons: string[]) {
    super(`Product cannot be made Active: ${reasons.join('; ')}.`);
  }
}

export class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND';
  constructor(idOrSlug: string) {
    super(`Product "${idOrSlug}" was not found.`);
  }
}

export class ArchivedProductNotAddableError extends DomainError {
  readonly code = 'ARCHIVED_PRODUCT_NOT_ADDABLE';
  constructor(productId: string) {
    super(`Product "${productId}" is archived and cannot be added to a collection.`);
  }
}

export class CategoryNotFoundError extends DomainError {
  readonly code = 'CATEGORY_NOT_FOUND';
  constructor(idOrSlug: string) {
    super(`Category "${idOrSlug}" was not found.`);
  }
}

export class BrandNotFoundError extends DomainError {
  readonly code = 'BRAND_NOT_FOUND';
  constructor(idOrSlug: string) {
    super(`Brand "${idOrSlug}" was not found.`);
  }
}

export class TagNotFoundError extends DomainError {
  readonly code = 'TAG_NOT_FOUND';
  constructor(idOrSlug: string) {
    super(`Tag "${idOrSlug}" was not found.`);
  }
}

export class CollectionNotFoundError extends DomainError {
  readonly code = 'COLLECTION_NOT_FOUND';
  constructor(idOrSlug: string) {
    super(`Collection "${idOrSlug}" was not found.`);
  }
}

export class InvalidHexColorError extends DomainError {
  readonly code = 'INVALID_HEX_COLOR';
  constructor(value: string) {
    super(`"${value}" is not a valid hex color (expected e.g. "#1A2B3C").`);
  }
}

export class ColorNameAlreadyInUseError extends DomainError {
  readonly code = 'COLOR_NAME_ALREADY_IN_USE';
  constructor(name: string) {
    super(`The color name "${name}" is already in use.`);
  }
}

export class SizeLabelAlreadyInUseError extends DomainError {
  readonly code = 'SIZE_LABEL_ALREADY_IN_USE';
  constructor(label: string) {
    super(`The size label "${label}" is already in use.`);
  }
}

export class ColorNotFoundError extends DomainError {
  readonly code = 'COLOR_NOT_FOUND';
  constructor(id: string) {
    super(`Color "${id}" was not found.`);
  }
}

export class SizeNotFoundError extends DomainError {
  readonly code = 'SIZE_NOT_FOUND';
  constructor(id: string) {
    super(`Size "${id}" was not found.`);
  }
}

export class ProductVariantNotFoundError extends DomainError {
  readonly code = 'PRODUCT_VARIANT_NOT_FOUND';
  constructor(id: string) {
    super(`Product variant "${id}" was not found.`);
  }
}

export class VariantBarcodeAlreadyInUseError extends DomainError {
  readonly code = 'VARIANT_BARCODE_ALREADY_IN_USE';
  constructor(barcode: string) {
    super(`The barcode "${barcode}" is already in use.`);
  }
}

export class DuplicateVariantAttributesError extends DomainError {
  readonly code = 'DUPLICATE_VARIANT_ATTRIBUTES';
  constructor() {
    super('A variant with this exact color/size combination already exists for this product.');
  }
}

export class MultipleCoverImagesError extends DomainError {
  readonly code = 'MULTIPLE_COVER_IMAGES';
  constructor() {
    super('A product can have at most one cover image.');
  }
}

export class CoverImageMustBeImageError extends DomainError {
  readonly code = 'COVER_IMAGE_MUST_BE_IMAGE';
  constructor() {
    super('The cover must be an image, not a video.');
  }
}

export class ImageAltTextRequiredError extends DomainError {
  readonly code = 'IMAGE_ALT_TEXT_REQUIRED';
  constructor() {
    super('Every image requires descriptive alt text.');
  }
}

export class SelfProductRelationError extends DomainError {
  readonly code = 'SELF_PRODUCT_RELATION';
  constructor() {
    super('A product cannot be related to itself.');
  }
}

export class LastVariantOfActiveProductError extends DomainError {
  readonly code = 'LAST_VARIANT_OF_ACTIVE_PRODUCT';
  constructor() {
    super('Cannot remove the last variant of an Active product — archive or draft it first.');
  }
}

export class LastCoverImageOfActiveProductError extends DomainError {
  readonly code = 'LAST_COVER_IMAGE_OF_ACTIVE_PRODUCT';
  constructor() {
    super('Cannot remove the cover image of an Active product — archive or draft it first.');
  }
}
