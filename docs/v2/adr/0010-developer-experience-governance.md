# ADR 0010: Developer Experience & Governance

**Status**: Accepted
**Supersedes**: extends [v1 15-PROJECT-STANDARDS.md](../../15-PROJECT-STANDARDS.md)
rather than replacing it — adds process (ADR/RFC discipline, ownership,
new testing categories) that v1's standards doc didn't cover because v1
had no precedent of a major redesign yet.
**Full detail**: [08-DEVELOPER-EXPERIENCE.md](../08-DEVELOPER-EXPERIENCE.md).

## Context

This very v2 redesign is the first time this project has had to
substantially revise an earlier architectural decision. v1's standards
doc had a review checklist but no formal mechanism for *how a decision
gets revised* — without one, the next revision after this one risks
becoming an ad hoc doc edit instead of a recorded, reasoned change, which
is exactly the "silently edited paragraph loses the reasoning trail"
problem this whole v2 effort was structured to avoid (see
[00-OVERVIEW.md](../00-OVERVIEW.md)).

## Decision

1. **ADRs are now a standing practice**, not a one-time artifact of this
   redesign. Every architecturally significant decision from here forward
   gets a numbered ADR in `docs/v2/adr/` (or a future `docs/v3/adr/` etc.),
   with a `Status` (Proposed/Accepted/Superseded) and, when it replaces an
   earlier one, an explicit `Supersedes` line — never a silent edit.
2. **RFCs precede ADRs for genuinely large changes** — anything bigger
   than one ADR's scope (a real multi-tenancy migration, a new plugin
   category, a payment-gateway switch) gets a lightweight RFC first
   (problem / proposal / alternatives / open questions), circulated for
   discussion, *then* an ADR records the resulting decision. This
   distinguishes "we're exploring this" from "we decided this" — v1 didn't
   have this distinction, and the senior review's finding that several v1
   "should" statements read as unenforced aspiration is partly a symptom
   of that missing distinction.
3. **Code ownership**: a `CODEOWNERS`-style mapping from bounded context to
   responsible person/team, named explicitly even while the team is one
   person — the convention should already exist before it's needed by a
   second contributor, not invented under pressure when one shows up.
4. **Module boundaries**: reaffirms v1's lint-enforced Clean Architecture
   boundaries ([v1 15-PROJECT-STANDARDS.md §4](../../15-PROJECT-STANDARDS.md#4-code-style)),
   extended with one new rule from [ADR 0007](0007-plugin-architecture.md):
   a plugin module may depend on a core port; core must never import a
   specific plugin's implementation. Enforced by the same boundaries-lint
   mechanism, not a new tool.
5. **Migration strategy**: reaffirms v1's additive-first, two-phase-
   destructive discipline ([v1 14-DEPLOYMENT.md §9](../../14-DEPLOYMENT.md#9-zero-downtime-deployment)),
   adding: any migration implementing a decision from this ADR set
   references the ADR number in its migration name/comment, so `git blame`
   on a schema change always leads back to its rationale.
6. **Versioning strategy**: this documentation set is itself versioned —
   v1 stands as the historical first pass, v2 supersedes it via ADRs for
   the areas it covers, and a hypothetical v3 would follow the identical
   pattern (new ADRs, a new `docs/v3/` overlay) — never a silent rewrite
   of a prior version's files.
7. **Testing pyramid additions**, on top of
   [v1 15-PROJECT-STANDARDS.md §5](../../15-PROJECT-STANDARDS.md#5-testing-strategy):
   - **Reservation concurrency tests** — a property/load test simulating
     concurrent reservation attempts against limited stock (per
     [ADR 0001](0001-inventory-reservation-strategy.md)), not just unit
     tests of the happy path.
   - **Outbox idempotency tests** — processing the same `OutboxEvent`
     twice must be safe (per [ADR 0002](0002-event-architecture.md)).
   - **Plugin-registry tests** — a disabled plugin's routes must genuinely
     not exist (404, not a hidden-but-reachable route), not merely be
     absent from a UI.

## Consequences

- Every ADR in this v2 set is itself evidence the process works — this
  document set follows the rule it's establishing.
- Adds process overhead (writing an RFC before a big change) that a small
  team may be tempted to skip under deadline pressure — this is a known,
  accepted cost, worth naming rather than pretending discipline is free.
- Ties the "80% domain-layer coverage" target from v1
  ([v1 15-PROJECT-STANDARDS.md §5](../../15-PROJECT-STANDARDS.md#5-testing-strategy))
  — which the senior review flagged as stated without an enforcement
  mechanism — to concrete new test categories with a clear pass/fail
  shape, making it easier to actually gate in CI rather than remain
  aspirational prose.

## Alternatives Considered

- **No formal process, rely on good judgment and PR review.** This is
  what v1 implicitly had, and it's exactly what produced the two
  inconsistencies ([ADR 0004](0004-order-snapshot-redesign.md),
  [0005](0005-actor-reference-model.md)) the senior review caught by
  close reading rather than by any process catching them first. Rejected.
- **Full RFC process for every change, including small ones.** Rejected
  as disproportionate — the ADR-only path remains available for
  decisions scoped to one document; RFCs are reserved for genuinely large
  changes, not every schema tweak.
