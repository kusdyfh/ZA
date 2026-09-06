# ADR 0005: Actor Reference Model

**Status**: Accepted
**Supersedes**: the inconsistent actor-reference fields in
[v1 03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md) —
`OrderStatusHistory.changedByAdminId`, `StockMovement.createdByAdminId`,
`BlogPost.authorAdminId` (bare, unrelated `String?` fields) alongside
`OrderNote.author` (a real Prisma relation) — the same concept modeled two
different ways in the same schema.
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #5](../../16-SENIOR-ARCHITECTURE-REVIEW.md).

## Context

v1 sometimes referenced "which admin did this" with a real relation
(enforced referential integrity, `include`-able) and sometimes with a bare
string that happened to be named like a foreign key but wasn't one — no
integrity check, no join, and a future admin-account deletion would
silently orphan the string fields instead of being caught by the
database.

The naive fix — "make every actor reference a plain relation to
`AdminUser`" — is wrong, because it isn't true that every actor is always
an admin. Some fields (`StockMovement`, `OrderStatusHistory`) are
legitimately triggered by *either* a human admin action *or* the system
itself (e.g., automatic stock deduction on checkout, an automatic COD
order auto-confirmation). Forcing those onto a single `AdminUser` relation
would require inventing a fake "System" admin account — a common but ugly
workaround that then has to be excluded from every "which staff member did
this" report.

## Decision

**A deliberate, non-uniform rule** — the correct fix is judgment per
field, not blanket uniformity:

1. **If the actor type is always exactly one kind of entity**, use a real
   Prisma relation to that entity. Example: `BlogPost.authorAdminId` — only
   staff author blog posts, ever — becomes a proper
   `author AdminUser @relation(...)`.
2. **If the actor is genuinely polymorphic** (could be an admin, a
   customer, or the system itself), use an explicit two-column pattern:
   `actorId String?` + `actorType ActorType`, where:

   ```prisma
   enum ActorType {
     ADMIN
     CUSTOMER
     SYSTEM
   }
   ```

   `actorId` is nullable and unconstrained by a single FK (it may point to
   `AdminUser.id` or `Customer.id` depending on `actorType`, or be null
   when `actorType = SYSTEM`); application code resolves the join based on
   `actorType`, and a documented convention (not a DB constraint, since
   Prisma cannot express a conditional FK) requires every write path to
   set both fields together, enforced via a single shared
   `ActorContext`/`buildActorRef()` helper used everywhere an actor
   reference is written — never constructed ad hoc per module.
3. **A bare, untyped `String?` actor reference with neither of the above
   is never acceptable again.** This is now a hard rule in the review
   checklist (see [11-FREEZE-CHECKLIST.md](../11-FREEZE-CHECKLIST.md) and
   [08-DEVELOPER-EXPERIENCE.md](../08-DEVELOPER-EXPERIENCE.md)).

### Applied to the v1 schema

| Field | v1 shape | v2 shape | Why |
|---|---|---|---|
| `OrderNote.authorId` | real relation to `AdminUser` | **unchanged** | Only staff write notes — already correct. |
| `BlogPost.authorAdminId` | bare string | real relation to `AdminUser` | Only staff author posts — fixed type, use a real relation. |
| `OrderStatusHistory.changedByAdminId` | bare string | `actorId` + `actorType` (polymorphic) | A status change can be admin-triggered (a warehouse marking "Shipped") *or* system-triggered (auto-confirm on COD placement) — genuinely two kinds of actor. |
| `StockMovement.createdByAdminId` | bare string | `actorId` + `actorType` (polymorphic) | Manual admin adjustment vs. system-driven `SALE`/`RESERVATION` movements (per [ADR 0001](0001-inventory-reservation-strategy.md)) — genuinely two kinds of actor, plus background-job-triggered `EXPIRED` releases, which are `SYSTEM`. |

## Consequences

- Referential integrity is real wherever the actor type is fixed (a
  deleted/anonymized `AdminUser` can no longer silently orphan a
  `BlogPost.author` reference — the FK constraint surfaces it).
- Polymorphic actor fields cannot be a native Prisma-enforced FK (Prisma
  doesn't support conditional foreign keys) — this is an accepted,
  explicit limitation, mitigated entirely by process (the shared
  `buildActorRef()` helper) rather than a database guarantee. This is
  weaker than a real FK and is stated as such, not oversold.
- Every future "who did this" field gets designed against this decision
  tree at review time (§3 of the freeze checklist) instead of copy-pasting
  whatever pattern happens to be nearby in the code, which is exactly how
  v1 ended up with two inconsistent patterns in the first place.

## Alternatives Considered

- **Force every actor reference to a single `AdminUser` relation, invent a
  reserved "System" `AdminUser` row for automated actions.** Rejected —
  pollutes the admin-user list with a fake account that then has to be
  filtered out of every staff-facing report and audit view, and still
  can't represent a *customer*-triggered actor if one is ever needed.
- **A single generic `Actor` entity table (its own `id`, `type`, denormalized
  `displayName`) that every reference points to via one real FK.**
  Considered seriously — this would restore true FK integrity for the
  polymorphic case. Rejected for v2 as unnecessary complexity (a
  write-through table that must stay in sync with `AdminUser`/`Customer`)
  given the actual polymorphic cases are few (two fields) — noted in
  [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md) as worth revisiting if
  polymorphic actor fields proliferate beyond these two.
