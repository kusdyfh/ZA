import type { Color } from '@/features/colors/api';
import type { Product, ProductVariant } from '@/features/products/types';

/**
 * The three rig layers every character base is split into (Character System
 * spec, Section 07 "Product compositing rules"). `hairBack` and `hairFront`
 * are separated so a garment's collar can sit between them — hair never
 * floats on top of a collar it should tuck behind.
 */
export interface CharacterLayerAssets {
  hairBackUrl: string;
  bodyUrl: string;
  hairFrontUrl: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  assets: CharacterLayerAssets;
  /** Optional signature accessory, rendered above the garment + hair-front layers. */
  accessoryUrl?: string;
}

/**
 * One authored, rig-aligned image per available colour of a garment.
 * `colorId` maps to the real catalog `Color` (features/colors/api.ts) —
 * switching colour swaps this asset's `imageUrl`, never a CSS filter.
 */
export interface GarmentVariantAsset {
  colorId: string;
  imageUrl: string;
}

/**
 * The admin-configurable link between a reusable character base and a real
 * catalog product (Character System spec: `CharacterOutfitAssignment`).
 * This is local, hardcoded seed data until the future Admin Character/Outfit
 * CMS exists to author it — see `data.ts`.
 */
export interface CharacterOutfitAssignment {
  characterId: string;
  product: Product;
  variants: ProductVariant[];
  colors: Color[];
  garmentAssets: GarmentVariantAsset[];
}
