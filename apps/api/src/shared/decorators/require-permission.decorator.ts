import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../../modules/identity/domain/constants/permissions.constants';

export const REQUIRE_PERMISSION_KEY = 'requiredPermission';

/**
 * Declares the permission `PermissionGuard` (ADR 0017 §7) requires for a
 * route. A guarded route with no `@RequirePermission(...)` still
 * requires a valid, authenticated admin (via `JwtAuthGuard`) — it just
 * doesn't additionally check a specific permission. Every permission key
 * here is drawn from Identity's existing `PERMISSION_KEYS`
 * (docs/v2/adr/0017 §7) — no new keys were added for this epic.
 */
export const RequirePermission = (key: PermissionKey): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_PERMISSION_KEY, key);
