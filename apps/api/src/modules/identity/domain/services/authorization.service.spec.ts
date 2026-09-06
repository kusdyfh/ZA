import { AuthorizationService } from './authorization.service';
import { PermissionDeniedError } from '../errors/identity.errors';
import type { RoleWithPermissionKeys } from '../repositories/role.repository';
import { Role } from '../entities/role.entity';

function roleWithPermissions(permissionKeys: string[]): RoleWithPermissionKeys {
  const role = Role.reconstitute({
    id: 'role-1',
    key: 'MANAGER',
    name: 'Manager',
    description: null,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { role, permissionKeys };
}

describe('AuthorizationService', () => {
  const authorization = new AuthorizationService();

  describe('hasPermission', () => {
    it('returns true when the role has the permission', () => {
      const role = roleWithPermissions(['products.view']);
      expect(authorization.hasPermission(role, 'products.view')).toBe(true);
    });

    it('returns false when the role lacks the permission', () => {
      const role = roleWithPermissions(['products.view']);
      expect(authorization.hasPermission(role, 'products.manage')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission matches', () => {
      const role = roleWithPermissions(['orders.view']);
      expect(authorization.hasAnyPermission(role, ['orders.refund', 'orders.view'])).toBe(true);
    });

    it('returns false when none match', () => {
      const role = roleWithPermissions(['orders.view']);
      expect(authorization.hasAnyPermission(role, ['orders.refund', 'settings.manage'])).toBe(
        false,
      );
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true only when every permission matches', () => {
      const role = roleWithPermissions(['orders.view', 'orders.refund']);
      expect(authorization.hasAllPermissions(role, ['orders.view', 'orders.refund'])).toBe(true);
    });

    it('returns false when at least one permission is missing', () => {
      const role = roleWithPermissions(['orders.view']);
      expect(authorization.hasAllPermissions(role, ['orders.view', 'orders.refund'])).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('does not throw when the permission is granted', () => {
      const role = roleWithPermissions(['settings.manage']);
      expect(() => authorization.assertPermission(role, 'settings.manage')).not.toThrow();
    });

    it('throws PermissionDeniedError when the permission is missing', () => {
      const role = roleWithPermissions([]);
      expect(() => authorization.assertPermission(role, 'settings.manage')).toThrow(
        PermissionDeniedError,
      );
    });
  });
});
