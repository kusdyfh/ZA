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

/** Character — Noor (Medical). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const NOOR_CHARACTER: Character = {
  id: 'noor',
  name: 'Noor',
  role: 'Medical',
  assets: {
    hairBackUrl: '/characters/noor/hair-back.svg',
    bodyUrl: '/characters/noor/body.svg',
    hairFrontUrl: '/characters/noor/hair-front.svg',
  },
  accessoryUrl: '/characters/noor/accessory-stethoscope.svg',
};

/** Character — Lily (Lifestyle). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const LILY_CHARACTER: Character = {
  id: 'lily',
  name: 'Lily',
  role: 'Lifestyle',
  assets: {
    hairBackUrl: '/characters/lily/hair-back.svg',
    bodyUrl: '/characters/lily/body.svg',
    hairFrontUrl: '/characters/lily/hair-front.svg',
  },
  accessoryUrl: '/characters/lily/accessory-flower.svg',
};

/** Character — Maya (Student). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const MAYA_CHARACTER: Character = {
  id: 'maya',
  name: 'Maya',
  role: 'Student',
  assets: {
    hairBackUrl: '/characters/maya/hair-back.svg',
    bodyUrl: '/characters/maya/body.svg',
    hairFrontUrl: '/characters/maya/hair-front.svg',
  },
  accessoryUrl: '/characters/maya/accessory-book.svg',
};

/** Character — Farah (Professional). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const FARAH_CHARACTER: Character = {
  id: 'farah',
  name: 'Farah',
  role: 'Professional',
  assets: {
    hairBackUrl: '/characters/farah/hair-back.svg',
    bodyUrl: '/characters/farah/body.svg',
    hairFrontUrl: '/characters/farah/hair-front.svg',
  },
  accessoryUrl: '/characters/farah/accessory-bag.svg',
};

/** Character — Amal (Minimal). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const AMAL_CHARACTER: Character = {
  id: 'amal',
  name: 'Amal',
  role: 'Minimal',
  assets: {
    hairBackUrl: '/characters/amal/hair-back.svg',
    bodyUrl: '/characters/amal/body.svg',
    hairFrontUrl: '/characters/amal/hair-front.svg',
  },
  accessoryUrl: '/characters/amal/accessory-pendant.svg',
};

/** Character — Dana (Active). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const DANA_CHARACTER: Character = {
  id: 'dana',
  name: 'Dana',
  role: 'Active',
  assets: {
    hairBackUrl: '/characters/dana/hair-back.svg',
    bodyUrl: '/characters/dana/body.svg',
    hairFrontUrl: '/characters/dana/hair-front.svg',
  },
  accessoryUrl: '/characters/dana/accessory-headband.svg',
};

/** Character — Yara (Creative). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const YARA_CHARACTER: Character = {
  id: 'yara',
  name: 'Yara',
  role: 'Creative',
  assets: {
    hairBackUrl: '/characters/yara/hair-back.svg',
    bodyUrl: '/characters/yara/body.svg',
    hairFrontUrl: '/characters/yara/hair-front.svg',
  },
  accessoryUrl: '/characters/yara/accessory-paint.svg',
};

/** Character — Hana (Campaign). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const HANA_CHARACTER: Character = {
  id: 'hana',
  name: 'Hana',
  role: 'Campaign',
  assets: {
    hairBackUrl: '/characters/hana/hair-back.svg',
    bodyUrl: '/characters/hana/body.svg',
    hairFrontUrl: '/characters/hana/hair-front.svg',
  },
  accessoryUrl: '/characters/hana/accessory-earrings.svg',
};

/** Character — Sara (Modest). Same rig as {@link ROSE_CHARACTER}: identical neutral pose and body coordinates, distinct face/hair/skin/accessory. */
export const SARA_CHARACTER: Character = {
  id: 'sara',
  name: 'Sara',
  role: 'Modest',
  assets: {
    hairBackUrl: '/characters/sara/hair-back.svg',
    bodyUrl: '/characters/sara/body.svg',
    hairFrontUrl: '/characters/sara/hair-front.svg',
  },
  accessoryUrl: '/characters/sara/accessory-necklace.svg',
};

export const CHARACTERS: Character[] = [
  ROSE_CHARACTER,
  NOOR_CHARACTER,
  LILY_CHARACTER,
  MAYA_CHARACTER,
  FARAH_CHARACTER,
  AMAL_CHARACTER,
  DANA_CHARACTER,
  YARA_CHARACTER,
  HANA_CHARACTER,
  SARA_CHARACTER,
];

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
      sku: 'ZA-SCR-001-PIN',
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
      sku: 'ZA-SCR-001-BLA',
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

/** Noor's current outfit assignment: Lab Coat 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const NOOR_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'noor',
  product: {
    id: 'lab-coat-01',
    name: 'Lab Coat 01',
    slug: 'lab-coat-01',
    sku: 'ZA-NOOR-001',
    shortDescription:
      'A crisp, softly tailored lab coat for the clinic and the classroom.',
    description:
      'A crisp, softly tailored lab coat for the clinic and the classroom.',
    status: 'ACTIVE',
    price: '159.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'coats',
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
      id: 'lab-coat-01-cream',
      productId: 'lab-coat-01',
      sku: 'ZA-NOOR-001-CRE',
      barcode: null,
      colorId: 'cream',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'lab-coat-01-plum',
      productId: 'lab-coat-01',
      sku: 'ZA-NOOR-001-PLU',
      barcode: null,
      colorId: 'plum',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'lab-coat-01-dustyrose',
      productId: 'lab-coat-01',
      sku: 'ZA-NOOR-001-DUS',
      barcode: null,
      colorId: 'dustyrose',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'cream', name: 'Cream', hexCode: '#F1E9DD' },
    { id: 'plum', name: 'Plum', hexCode: '#7B4D6D' },
    { id: 'dustyrose', name: 'Dusty Rose', hexCode: '#D88AAD' },
  ],
  garmentAssets: [
    { colorId: 'cream', imageUrl: '/garments/lab-coat-01/cream.svg' },
    { colorId: 'plum', imageUrl: '/garments/lab-coat-01/plum.svg' },
    { colorId: 'dustyrose', imageUrl: '/garments/lab-coat-01/dustyrose.svg' },
  ],
};

/** Lily's current outfit assignment: Knit Dress 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const LILY_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'lily',
  product: {
    id: 'knit-dress-01',
    name: 'Knit Dress 01',
    slug: 'knit-dress-01',
    sku: 'ZA-LILY-001',
    shortDescription: 'A soft knit dress for the days in between shifts.',
    description: 'A soft knit dress for the days in between shifts.',
    status: 'ACTIVE',
    price: '99.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'dresses',
    brandId: null,
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'knit-dress-01-gold',
      productId: 'knit-dress-01',
      sku: 'ZA-LILY-001-GOL',
      barcode: null,
      colorId: 'gold',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'knit-dress-01-blush',
      productId: 'knit-dress-01',
      sku: 'ZA-LILY-001-BLU',
      barcode: null,
      colorId: 'blush',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'knit-dress-01-sage',
      productId: 'knit-dress-01',
      sku: 'ZA-LILY-001-SAG',
      barcode: null,
      colorId: 'sage',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'gold', name: 'Gold', hexCode: '#F8D98A' },
    { id: 'blush', name: 'Blush', hexCode: '#F6B7C8' },
    { id: 'sage', name: 'Sage', hexCode: '#8FA888' },
  ],
  garmentAssets: [
    { colorId: 'gold', imageUrl: '/garments/knit-dress-01/gold.svg' },
    { colorId: 'blush', imageUrl: '/garments/knit-dress-01/blush.svg' },
    { colorId: 'sage', imageUrl: '/garments/knit-dress-01/sage.svg' },
  ],
};

/** Maya's current outfit assignment: Campus Set 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const MAYA_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'maya',
  product: {
    id: 'campus-set-01',
    name: 'Campus Set 01',
    slug: 'campus-set-01',
    sku: 'ZA-MAYA-001',
    shortDescription:
      'A relaxed top-and-pants set for lecture halls and long study days.',
    description:
      'A relaxed top-and-pants set for lecture halls and long study days.',
    status: 'ACTIVE',
    price: '119.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'casual',
    brandId: null,
    isFeatured: false,
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
      id: 'campus-set-01-cream',
      productId: 'campus-set-01',
      sku: 'ZA-MAYA-001-CRE',
      barcode: null,
      colorId: 'cream',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'campus-set-01-dustyrose',
      productId: 'campus-set-01',
      sku: 'ZA-MAYA-001-DUS',
      barcode: null,
      colorId: 'dustyrose',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'campus-set-01-lavender',
      productId: 'campus-set-01',
      sku: 'ZA-MAYA-001-LAV',
      barcode: null,
      colorId: 'lavender',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'cream', name: 'Cream', hexCode: '#F1D9C4' },
    { id: 'dustyrose', name: 'Dusty Rose', hexCode: '#D88AAD' },
    { id: 'lavender', name: 'Lavender', hexCode: '#CDB8F0' },
  ],
  garmentAssets: [
    { colorId: 'cream', imageUrl: '/garments/campus-set-01/cream.svg' },
    { colorId: 'dustyrose', imageUrl: '/garments/campus-set-01/dustyrose.svg' },
    { colorId: 'lavender', imageUrl: '/garments/campus-set-01/lavender.svg' },
  ],
};

/** Farah's current outfit assignment: Tailored Blazer Set 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const FARAH_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'farah',
  product: {
    id: 'tailored-blazer-set-01',
    name: 'Tailored Blazer Set 01',
    slug: 'tailored-blazer-set-01',
    sku: 'ZA-FARAH-001',
    shortDescription:
      'A structured blazer and trouser set for the days that call for it.',
    description:
      'A structured blazer and trouser set for the days that call for it.',
    status: 'ACTIVE',
    price: '219.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'workwear',
    brandId: null,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'tailored-blazer-set-01-mauve',
      productId: 'tailored-blazer-set-01',
      sku: 'ZA-FARAH-001-MAU',
      barcode: null,
      colorId: 'mauve',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'tailored-blazer-set-01-black',
      productId: 'tailored-blazer-set-01',
      sku: 'ZA-FARAH-001-BLA',
      barcode: null,
      colorId: 'black',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'tailored-blazer-set-01-plum',
      productId: 'tailored-blazer-set-01',
      sku: 'ZA-FARAH-001-PLU',
      barcode: null,
      colorId: 'plum',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'mauve', name: 'Mauve', hexCode: '#C09098' },
    { id: 'black', name: 'Black', hexCode: '#2B2B2E' },
    { id: 'plum', name: 'Plum', hexCode: '#7B4D6D' },
  ],
  garmentAssets: [
    {
      colorId: 'mauve',
      imageUrl: '/garments/tailored-blazer-set-01/mauve.svg',
    },
    {
      colorId: 'black',
      imageUrl: '/garments/tailored-blazer-set-01/black.svg',
    },
    { colorId: 'plum', imageUrl: '/garments/tailored-blazer-set-01/plum.svg' },
  ],
};

/** Amal's current outfit assignment: Silk Slip Dress 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const AMAL_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'amal',
  product: {
    id: 'silk-slip-dress-01',
    name: 'Silk Slip Dress 01',
    slug: 'silk-slip-dress-01',
    sku: 'ZA-AMAL-001',
    shortDescription:
      'A minimal, elegant slip dress in a soft silk-touch fabric.',
    description: 'A minimal, elegant slip dress in a soft silk-touch fabric.',
    status: 'ACTIVE',
    price: '139.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'dresses',
    brandId: null,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'silk-slip-dress-01-cream',
      productId: 'silk-slip-dress-01',
      sku: 'ZA-AMAL-001-CRE',
      barcode: null,
      colorId: 'cream',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'silk-slip-dress-01-blush',
      productId: 'silk-slip-dress-01',
      sku: 'ZA-AMAL-001-BLU',
      barcode: null,
      colorId: 'blush',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'silk-slip-dress-01-champagne',
      productId: 'silk-slip-dress-01',
      sku: 'ZA-AMAL-001-CHA',
      barcode: null,
      colorId: 'champagne',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'cream', name: 'Cream', hexCode: '#F1E9DD' },
    { id: 'blush', name: 'Blush', hexCode: '#F6B7C8' },
    { id: 'champagne', name: 'Champagne', hexCode: '#F8D98A' },
  ],
  garmentAssets: [
    { colorId: 'cream', imageUrl: '/garments/silk-slip-dress-01/cream.svg' },
    { colorId: 'blush', imageUrl: '/garments/silk-slip-dress-01/blush.svg' },
    {
      colorId: 'champagne',
      imageUrl: '/garments/silk-slip-dress-01/champagne.svg',
    },
  ],
};

/** Dana's current outfit assignment: Active Set 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const DANA_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'dana',
  product: {
    id: 'active-set-01',
    name: 'Active Set 01',
    slug: 'active-set-01',
    sku: 'ZA-DANA-001',
    shortDescription:
      'A fitted, breathable set built to move with a long shift.',
    description: 'A fitted, breathable set built to move with a long shift.',
    status: 'ACTIVE',
    price: '109.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'activewear',
    brandId: null,
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'active-set-01-dustyrose',
      productId: 'active-set-01',
      sku: 'ZA-DANA-001-DUS',
      barcode: null,
      colorId: 'dustyrose',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'active-set-01-black',
      productId: 'active-set-01',
      sku: 'ZA-DANA-001-BLA',
      barcode: null,
      colorId: 'black',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'active-set-01-blue',
      productId: 'active-set-01',
      sku: 'ZA-DANA-001-BLU',
      barcode: null,
      colorId: 'blue',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'dustyrose', name: 'Dusty Rose', hexCode: '#C96B82' },
    { id: 'black', name: 'Black', hexCode: '#2B2B2E' },
    { id: 'blue', name: 'Blue', hexCode: '#35577A' },
  ],
  garmentAssets: [
    { colorId: 'dustyrose', imageUrl: '/garments/active-set-01/dustyrose.svg' },
    { colorId: 'black', imageUrl: '/garments/active-set-01/black.svg' },
    { colorId: 'blue', imageUrl: '/garments/active-set-01/blue.svg' },
  ],
};

/** Yara's current outfit assignment: Printed Co-ord Set 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const YARA_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'yara',
  product: {
    id: 'printed-coord-set-01',
    name: 'Printed Co-ord Set 01',
    slug: 'printed-coord-set-01',
    sku: 'ZA-YARA-001',
    shortDescription: 'A playful printed top-and-pants set for off-duty days.',
    description: 'A playful printed top-and-pants set for off-duty days.',
    status: 'ACTIVE',
    price: '129.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'casual',
    brandId: null,
    isFeatured: false,
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
      id: 'printed-coord-set-01-lavender',
      productId: 'printed-coord-set-01',
      sku: 'ZA-YARA-001-LAV',
      barcode: null,
      colorId: 'lavender',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'printed-coord-set-01-rose',
      productId: 'printed-coord-set-01',
      sku: 'ZA-YARA-001-ROS',
      barcode: null,
      colorId: 'rose',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'printed-coord-set-01-gold',
      productId: 'printed-coord-set-01',
      sku: 'ZA-YARA-001-GOL',
      barcode: null,
      colorId: 'gold',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'lavender', name: 'Lavender', hexCode: '#CDB8F0' },
    { id: 'rose', name: 'Rose', hexCode: '#E58FA7' },
    { id: 'gold', name: 'Gold', hexCode: '#F8D98A' },
  ],
  garmentAssets: [
    {
      colorId: 'lavender',
      imageUrl: '/garments/printed-coord-set-01/lavender.svg',
    },
    { colorId: 'rose', imageUrl: '/garments/printed-coord-set-01/rose.svg' },
    { colorId: 'gold', imageUrl: '/garments/printed-coord-set-01/gold.svg' },
  ],
};

/** Hana's current outfit assignment: Statement Coat 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const HANA_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'hana',
  product: {
    id: 'statement-coat-01',
    name: 'Statement Coat 01',
    slug: 'statement-coat-01',
    sku: 'ZA-HANA-001',
    shortDescription:
      'A bold, campaign-ready coat for the moments that call for one.',
    description:
      'A bold, campaign-ready coat for the moments that call for one.',
    status: 'ACTIVE',
    price: '249.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'coats',
    brandId: null,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [
    {
      id: 'statement-coat-01-rose',
      productId: 'statement-coat-01',
      sku: 'ZA-HANA-001-ROS',
      barcode: null,
      colorId: 'rose',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'statement-coat-01-black',
      productId: 'statement-coat-01',
      sku: 'ZA-HANA-001-BLA',
      barcode: null,
      colorId: 'black',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'statement-coat-01-gold',
      productId: 'statement-coat-01',
      sku: 'ZA-HANA-001-GOL',
      barcode: null,
      colorId: 'gold',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'rose', name: 'Rose', hexCode: '#E58FA7' },
    { id: 'black', name: 'Black', hexCode: '#2B2B2E' },
    { id: 'gold', name: 'Gold', hexCode: '#F8D98A' },
  ],
  garmentAssets: [
    { colorId: 'rose', imageUrl: '/garments/statement-coat-01/rose.svg' },
    { colorId: 'black', imageUrl: '/garments/statement-coat-01/black.svg' },
    { colorId: 'gold', imageUrl: '/garments/statement-coat-01/gold.svg' },
  ],
};

/** Sara's current outfit assignment: Modest Maxi Set 01 in 3 colours. Same `CharacterOutfitAssignment` shape as {@link ROSE_OUTFIT}. */
export const SARA_OUTFIT: CharacterOutfitAssignment = {
  characterId: 'sara',
  product: {
    id: 'modest-maxi-set-01',
    name: 'Modest Maxi Set 01',
    slug: 'modest-maxi-set-01',
    sku: 'ZA-SARA-001',
    shortDescription:
      'A graceful, full-length set designed for modest, elegant coverage.',
    description:
      'A graceful, full-length set designed for modest, elegant coverage.',
    status: 'ACTIVE',
    price: '189.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'modest',
    brandId: null,
    isFeatured: false,
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
      id: 'modest-maxi-set-01-gold',
      productId: 'modest-maxi-set-01',
      sku: 'ZA-SARA-001-GOL',
      barcode: null,
      colorId: 'gold',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'modest-maxi-set-01-dustyrose',
      productId: 'modest-maxi-set-01',
      sku: 'ZA-SARA-001-DUS',
      barcode: null,
      colorId: 'dustyrose',
      sizeId: null,
      priceOverride: null,
    },
    {
      id: 'modest-maxi-set-01-cream',
      productId: 'modest-maxi-set-01',
      sku: 'ZA-SARA-001-CRE',
      barcode: null,
      colorId: 'cream',
      sizeId: null,
      priceOverride: null,
    },
  ],
  colors: [
    { id: 'gold', name: 'Gold', hexCode: '#F8D98A' },
    { id: 'dustyrose', name: 'Dusty Rose', hexCode: '#D88AAD' },
    { id: 'cream', name: 'Cream', hexCode: '#F1E9DD' },
  ],
  garmentAssets: [
    { colorId: 'gold', imageUrl: '/garments/modest-maxi-set-01/gold.svg' },
    {
      colorId: 'dustyrose',
      imageUrl: '/garments/modest-maxi-set-01/dustyrose.svg',
    },
    { colorId: 'cream', imageUrl: '/garments/modest-maxi-set-01/cream.svg' },
  ],
};

/** Keyed by `characterId` — the shape the future CMS-backed API will return. */
export const OUTFIT_ASSIGNMENTS_BY_CHARACTER: Record<
  string,
  CharacterOutfitAssignment
> = {
  rose: ROSE_OUTFIT,
  noor: NOOR_OUTFIT,
  lily: LILY_OUTFIT,
  maya: MAYA_OUTFIT,
  farah: FARAH_OUTFIT,
  amal: AMAL_OUTFIT,
  dana: DANA_OUTFIT,
  yara: YARA_OUTFIT,
  hana: HANA_OUTFIT,
  sara: SARA_OUTFIT,
};
