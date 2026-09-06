import { ActorType, type ActorRef } from '@za/types';
import { AdminUser, type AdminUserProps } from './admin-user.entity';
import { Email } from '../value-objects/email.vo';
import { InvalidAdminUserNameError } from '../errors/identity.errors';

const systemActor: ActorRef = { actorId: null, actorType: ActorType.SYSTEM };
const adminActor: ActorRef = { actorId: 'admin-1', actorType: ActorType.ADMIN };

function buildAdminUser(overrides: Partial<AdminUserProps> = {}): AdminUser {
  const props: AdminUserProps = {
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    passwordHash: 'hashed',
    roleId: 'role-1',
    isActive: true,
    deactivatedAt: null,
    createdByActorId: null,
    createdByActorType: ActorType.SYSTEM,
    updatedByActorId: null,
    updatedByActorType: ActorType.SYSTEM,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
  return AdminUser.reconstitute(props);
}

describe('AdminUser.validateName', () => {
  it('trims and returns a non-empty name', () => {
    expect(AdminUser.validateName('  Jane Doe  ')).toBe('Jane Doe');
  });

  it('throws when the name is empty or whitespace-only', () => {
    expect(() => AdminUser.validateName('   ')).toThrow(InvalidAdminUserNameError);
  });
});

describe('AdminUser#deactivate', () => {
  it('marks the user inactive, stamps deactivatedAt, and records the actor', () => {
    const user = buildAdminUser({ isActive: true });
    user.deactivate(adminActor);

    expect(user.isActive).toBe(false);
    expect(user.deactivatedAt).not.toBeNull();
    expect(user.toProps().updatedByActorId).toBe('admin-1');
    expect(user.toProps().updatedByActorType).toBe(ActorType.ADMIN);
  });

  it('is a no-op when the user is already inactive', () => {
    const user = buildAdminUser({
      isActive: false,
      deactivatedAt: new Date('2026-01-02T00:00:00Z'),
      updatedByActorType: ActorType.SYSTEM,
    });
    user.deactivate(adminActor);

    expect(user.deactivatedAt).toEqual(new Date('2026-01-02T00:00:00Z'));
    expect(user.toProps().updatedByActorType).toBe(ActorType.SYSTEM);
  });
});

describe('AdminUser#activate', () => {
  it('marks the user active, clears deactivatedAt, and records the actor', () => {
    const user = buildAdminUser({ isActive: false, deactivatedAt: new Date() });
    user.activate(adminActor);

    expect(user.isActive).toBe(true);
    expect(user.deactivatedAt).toBeNull();
    expect(user.toProps().updatedByActorId).toBe('admin-1');
  });

  it('is a no-op when the user is already active', () => {
    const user = buildAdminUser({ isActive: true, updatedByActorType: ActorType.SYSTEM });
    user.activate(adminActor);

    expect(user.toProps().updatedByActorType).toBe(ActorType.SYSTEM);
  });
});

describe('AdminUser#changeRole', () => {
  it('updates the roleId and records the actor', () => {
    const user = buildAdminUser({ roleId: 'role-1' });
    user.changeRole('role-2', systemActor);

    expect(user.roleId).toBe('role-2');
    expect(user.toProps().updatedByActorType).toBe(ActorType.SYSTEM);
  });
});

describe('AdminUser#changePassword', () => {
  it('updates the passwordHash and records the actor', () => {
    const user = buildAdminUser({ passwordHash: 'old-hash' });
    user.changePassword('new-hash', adminActor);

    expect(user.passwordHash).toBe('new-hash');
    expect(user.toProps().updatedByActorId).toBe('admin-1');
    expect(user.toProps().updatedByActorType).toBe(ActorType.ADMIN);
  });
});
