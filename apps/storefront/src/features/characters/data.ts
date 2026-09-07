import type { Character, CharacterOutfitAssignment } from './types';

/**
 * Character 01 — Rose (Fashion). The first of the ten reusable base
 * characters; see Character System spec §"The ten ZA characters".
 * Layer assets are placeholders (public/characters/rose/*.svg) pending
 * production illustration — every consumer reads these as data, never
 * hardcodes the path, so swapping in final art touches no component.
 */
export const ROSE_CHARACTER: Character = {
  id: 'rose',
  name: 'Rose',
  role: 'Fashion',
  assets: {
    hairBackUrl: '/characters/rose/hair-back.svg',
    bodyUrl: '/characters/rose/body.svg',
    hairFrontUrl: '/characters/rose/hair-front.svg',
  },
  accessoryUrl: '/characters/rose/accessory-ribbon.svg',
};

export const CHARACTERS: Character[] = [ROSE_CHARACTER];

/**
 * Rose's current outfit assignment: one real-shaped `Product` (Scrub Set
 * 01) in four colours, each with its own authored garment asset. This is
 * local seed data standing in for the future Admin Character/Outfit CMS
 * (Character System spec §"Admin panel") — the `CharacterOutfitAssignment`
 * shape is exactly what that CMS will read and write, so the storefront
 * components built against it need no changes when the CMS lands.
 */
export const ROSE_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'rose',
  product: {
    id: 'scrub-set-01',
    name: 'Scrub Set 01',
    slug: 'scrub-set-01',
    sku: 'ZA-SCR-001',
    shortDescription: 'A soft, breathable scrub set built for long shifts.',
    description:
      'A soft, breathable scrub set built for long shifts — a relaxed V-neck top with a chest pocket, paired with straight-leg pants.',
    status: 'ACTIVE',
    price: '129.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'scrubs',
    brandId: null,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'scrub-set-01-pink',
      productId: 'scrub-set-01',
      sku: 'ZA-SCR-001-PNK',
      barcode: null,
      colorId: 'pink',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'scrub-set-01-purple',
      productId: 'scrub-set-01',
      sku: 'ZA-SCR-001-PUR',
      barcode: null,
      colorId: 'purple',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'scrub-set-01-black',
      productId: 'scrub-set-01',
      sku: 'ZA-SCR-001-BLK',
      barcode: null,
      colorId: 'black',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'scrub-set-01-blue',
      productId: 'scrub-set-01',
      sku: 'ZA-SCR-001-BLU',
      barcode: null,
      colorId: 'blue',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'pink', name: 'Pink', hexCode: '#C96B82' },
    { id: 'purple', name: 'Purple', hexCode: '#8E6FA8' },
    { id: 'black', name: 'Black', hexCode: '#2B2B2E' },
    { id: 'blue', name: 'Blue', hexCode: '#35577A' },
  ],
  garmentAssets: [
    { colorId: 'pink', imageUrl: '/garments/scrub-set-01/pink.svg' },
    { colorId: 'purple', imageUrl: '/garments/scrub-set-01/purple.svg' },
    { colorId: 'black', imageUrl: '/garments/scrub-set-01/black.svg' },
    { colorId: 'blue', imageUrl: '/garments/scrub-set-01/blue.svg' },
  ],
};

/** Keyed by `characterId` — the shape the future CMS-backed API will return. */
export const OUTFIT_ASSIGNMENTS_BY_CHARACTER: Record<
  string,
  CharacterOutfitAssignment
> = {
  rose: ROSE_OUTFIT,
};
