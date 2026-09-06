export interface CartLineItem {
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** The priced, named shape only `GET /checkout/cart` returns (ADR 0022 §4). */
export interface CartView {
  guestToken: string;
  currencyCode: string;
  items: CartLineItem[];
  subtotal: number;
}
