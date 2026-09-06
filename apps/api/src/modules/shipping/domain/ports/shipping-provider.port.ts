export const SHIPPING_PROVIDER = Symbol('SHIPPING_PROVIDER');

export interface CreateLabelInput {
  trackingNumber: string;
  carrierName: string | null;
}

export interface ShippingLabelResult {
  /** Always null for `ManualShippingProvider` — no real carrier API exists to call (docs/product/11-SHIPPING.md's disclosed v1 scope). */
  labelUrl: string | null;
  trackingUrl: string | null;
}

/**
 * Provider abstraction (ADR 0027) — one implementation,
 * `ManualShippingProvider`, backed entirely by admin-configured
 * Zone/Method/Rate tables. The interface exists so a future real-carrier
 * adapter (e.g. Aramex) is an additive implementation, not a redesign.
 */
export interface ShippingProviderPort {
  readonly provider: 'MANUAL';
  createLabel(input: CreateLabelInput): Promise<ShippingLabelResult>;
}
