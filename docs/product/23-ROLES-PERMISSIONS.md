# 23 — Roles & Permissions

## Purpose

Define, in plain business terms, who can do what across the entire
platform — the business-facing view of the access model that every other
module's Permissions section already references.

## Business Rules

- Five fixed staff roles exist in v1: **Super Admin, Manager, Warehouse,
  Sales, Customer Support**. There is no custom/configurable role in v1 —
  every staff account is assigned exactly one of these five.
- Only a Super Admin can create staff accounts and assign roles — no
  role can grant itself or another account more access than it already
  has.
- At least one active Super Admin must always exist. The system will not
  allow the last Super Admin account to be deactivated or reassigned to a
  different role.

## The role model, in business terms

| Role | What they own |
|---|---|
| **Super Admin** | Everything — the only role that manages staff accounts, roles, and store-wide Settings. |
| **Manager** | Day-to-day merchandising and operations: products, categories, collections, orders, coupons, reviews, homepage/content, analytics. Cannot manage staff accounts or Settings. |
| **Warehouse** | Physical stock reality: inventory levels and adjustments, and moving orders through picking/packing/shipping. |
| **Sales** | The customer-facing sales relationship: viewing/managing orders, looking up customers, applying coupons. |
| **Customer Support** | Post-purchase customer care: order notes, cancellations/returns after the self-service window, and review moderation. |
| **Customer** | The storefront shopper — not a staff role, listed here because every module's Permissions section includes what a customer can do for themselves. |

## User Stories

- As a Super Admin, I want to assign a new hire the Warehouse role, so
  they immediately have exactly the access their job requires — no more,
  no less.
- As a Super Admin, I want to review who has access to what before an
  internal audit, so I can confirm nothing is over-permissioned.
- As a Manager, I want to be blocked from actions outside my role (like
  managing staff accounts), so the system enforces the same boundaries
  everyone agreed to, without relying on people just remembering not to.

## Acceptance Criteria

- Given a Super Admin attempts to demote or deactivate the only remaining
  Super Admin account (their own or another's), When submitted, Then it's
  blocked with a clear explanation that at least one must remain.
- Given a Manager account, When they attempt to reach a Settings or
  staff-management screen, Then access is denied — this isn't just hidden
  from their navigation, it's actually blocked if reached directly.
- Given a Super Admin changes a staff member's role, When saved, Then
  that staff member's access reflects the new role on their very next
  action, without requiring them to log out and back in.

## Edge Cases

- A staff member's role is changed while they're actively using the
  dashboard → their available actions update to match the new role
  immediately, and anything mid-progress that's no longer permitted (e.g.
  an in-progress action their new role can't perform) is safely stopped,
  not left in a broken half-done state.
- Every module's individual Permissions section is the authoritative
  detail for that module — this document is the summary and the shared
  reference, not a duplicate source of truth that could drift from them.

## Validation Rules

- A staff account must be assigned exactly one of the five fixed roles —
  never zero, never more than one.

## Permissions

- Assigning/changing roles: Super Admin only.
- Viewing the staff list and their roles: Super Admin only (per
  [10-Admin Dashboard Spec, Users & RBAC](../10-ADMIN-DASHBOARD-SPEC.md#15-users--rbac--super-admin-only)
  in the architecture documents — this product spec doesn't repeat the
  detailed screen behavior, only the business rule).

## UI Behaviour

- A staff list showing each person's role clearly (e.g., as a badge),
  with role reassignment restricted to Super Admin's view.
- A role-appropriate navigation menu — a staff member simply never sees a
  menu item for something their role can't do, rather than seeing it
  disabled/greyed out.

## Error States

- Attempted access to a screen or action outside a role's permissions:
  denied with a clear "you don't have access to this" message, never a
  confusing broken page.
- Attempted removal of the last Super Admin: blocked with a specific
  explanation.

## Notifications

- A role-changed confirmation email to the affected staff member — a
  reasonable security notice whenever someone's access level changes.

## Future Expansion

- Custom, granular permissions beyond the five fixed roles (e.g.,
  per-module permission toggles rather than a fixed role bundle) — this
  is the single most-requested kind of change a growing business or a
  future client typically wants, and is intentionally named here as
  planned future work, not a limitation nobody's aware of.

## Functional Requirements

- FR-1: Enforce exactly five fixed staff roles, each with its own defined
  access scope.
- FR-2: Restrict staff-account and role management to Super Admin only.
- FR-3: Prevent the last Super Admin account from ever being deactivated
  or reassigned.
- FR-4: Apply a role change to that staff member's access immediately.

## Non-Functional Requirements

- Permission checks are consistent everywhere — a role's access is never
  different depending on which screen or path is used to reach the same
  action.

## Business Constraints

- Five fixed roles only in v1 — no custom/configurable roles yet (see
  Future Expansion).

## Dependencies

- Every module in this document set references this one for its
  Permissions section — this is the shared source of truth for "who can
  do what."

## Open Questions

- When custom/granular permissions are eventually built, do the five
  existing roles become starting templates that can be customized, or do
  they remain fixed alongside a new, separate custom-role system?
