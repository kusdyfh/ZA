import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or an entire controller) out of `TemporaryAdminGuard` —
 * see docs/v2/adr/0016-api-layer-conventions.md §2. Used only for
 * genuinely guest-accessible surfaces: storefront Catalog reads, Cart,
 * Checkout submission.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
