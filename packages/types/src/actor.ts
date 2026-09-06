/**
 * The polymorphic actor reference shape decided in
 * docs/v2/adr/0005-actor-reference-model.md — used wherever a record
 * needs to attribute an action to "an admin, a customer, or the system"
 * rather than a single fixed entity type. Fields that always reference
 * exactly one entity type use a normal typed relation instead of this
 * shape (see the ADR for the decision tree).
 */

export enum ActorType {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  SYSTEM = 'SYSTEM',
}

export interface ActorRef {
  actorId: string | null;
  actorType: ActorType;
}
