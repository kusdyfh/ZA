import type { ActorType, ActorRef } from '@za/types';
import type { Email } from '../value-objects/email.vo';
import { InvalidAdminUserNameError } from '../errors/identity.errors';

export interface AdminUserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  roleId: string;
  isActive: boolean;
  deactivatedAt: Date | null;
  createdByActorId: string | null;
  createdByActorType: ActorType;
  updatedByActorId: string | null;
  updatedByActorType: ActorType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The staff-account entity ("User Domain"). Exactly one Role per user —
 * see docs/product/23-ROLES-PERMISSIONS.md. Actor attribution on every
 * mutation follows the polymorphic shape from
 * docs/v2/adr/0005-actor-reference-model.md.
 *
 * New instances are produced by the repository (see
 * AdminUserRepository.create), not by a public constructor here —
 * assigning an id/createdAt/updatedAt before the row actually exists in
 * Postgres would be misleading. `reconstitute` is for rebuilding an
 * entity that's already persisted.
 */
export class AdminUser {
  private constructor(private props: AdminUserProps) {}

  static reconstitute(props: AdminUserProps): AdminUser {
    return new AdminUser(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidAdminUserNameError();
    }
    return trimmed;
  }

  deactivate(actor: ActorRef): void {
    if (!this.props.isActive) {
      return;
    }
    this.props.isActive = false;
    this.props.deactivatedAt = new Date();
    this.recordActor(actor);
  }

  activate(actor: ActorRef): void {
    if (this.props.isActive) {
      return;
    }
    this.props.isActive = true;
    this.props.deactivatedAt = null;
    this.recordActor(actor);
  }

  changeRole(roleId: string, actor: ActorRef): void {
    this.props.roleId = roleId;
    this.recordActor(actor);
  }

  /** Epic 7 (Authentication & Authorization) — self-service change or a completed reset. */
  changePassword(newPasswordHash: string, actor: ActorRef): void {
    this.props.passwordHash = newPasswordHash;
    this.recordActor(actor);
  }

  private recordActor(actor: ActorRef): void {
    this.props.updatedByActorId = actor.actorId;
    this.props.updatedByActorType = actor.actorType;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deactivatedAt(): Date | null {
    return this.props.deactivatedAt;
  }

  toProps(): AdminUserProps {
    return { ...this.props };
  }
}
