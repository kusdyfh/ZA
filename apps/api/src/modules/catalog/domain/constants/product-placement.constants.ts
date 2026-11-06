/** Plain TS union, not Prisma's generated `ProductPlacement` — same defensive-boundary pattern as PRODUCT_STATUS. */
export const PRODUCT_PLACEMENT = {
  HOME_HERO: 'HOME_HERO',
  ART_STORY_WALL: 'ART_STORY_WALL',
  TEN_PRODUCTS_SHOWCASE: 'TEN_PRODUCTS_SHOWCASE',
  ZA_EDIT_BOOK: 'ZA_EDIT_BOOK',
  DOLL_DRESS_UP: 'DOLL_DRESS_UP',
} as const;

export type ProductPlacementValue =
  (typeof PRODUCT_PLACEMENT)[keyof typeof PRODUCT_PLACEMENT];

export const PRODUCT_PLACEMENTS: readonly ProductPlacementValue[] =
  Object.values(PRODUCT_PLACEMENT);
