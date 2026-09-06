/** Plain TS union, not Prisma's generated `ProductMediaType` — same defensive-boundary pattern as PRODUCT_STATUS. */
export const PRODUCT_MEDIA_TYPE = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
} as const;

export type ProductMediaTypeValue = (typeof PRODUCT_MEDIA_TYPE)[keyof typeof PRODUCT_MEDIA_TYPE];
