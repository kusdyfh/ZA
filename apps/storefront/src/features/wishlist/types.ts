export type WishlistAvailability = 'AVAILABLE' | 'NO_LONGER_AVAILABLE';

export interface WishlistEntry {
  productId: string;
  productName: string;
  slug: string;
  price: number;
  currencyCode: string;
  availability: WishlistAvailability;
  addedAt: string;
}
