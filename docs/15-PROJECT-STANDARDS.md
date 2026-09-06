# ZA Store — Project Standards

The conventions every contributor (including a future team working on a
different client deployment of this same platform) follows so the codebase
stays coherent as it grows.

## 1. Folder Naming

- All directories: `kebab-case` — no exceptions, including feature
  folders (`product-variants/`, not `productVariants/`).
- Feature-based, not type-based, above the leaf level — `features/cart/`
  containing its own components/hooks/api, not a global `components/`
  dumping ground (already established in
  [02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md)).
- Backend modules mirror bounded contexts 1:1
  ([06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md)) — a new
  module name is chosen by asking "which context owns this," never by
  convenience of where the code happens to be needed first.

## 2. Branch Naming

`<type>/<short-kebab-description>`, e.g.:

```
feat/coupon-category-scoping
fix/stock-reservation-race
chore/upgrade-prisma-6
docs/update-api-review
refactor/extract-pricing-service
```

Types match the commit-convention types below, kept identical on purpose
so a branch name and its eventual squash-commit type never disagree.

## 3. Commit Convention

**Conventional Commits**, enforced via commit-lint in CI:

```
<type>(<scope>): <short summary>

<optional body — the WHY, not a restatement of the diff>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`,
`ci`. Scope is the bounded context or shared package touched (`feat(catalog):
...`, `fix(checkout): ...`, `chore(deps): ...`). A commit touching more than
one context's module is a signal the change should probably be split, not
a signal to omit the scope.

## 4. Code Style

- **Formatting**: Prettier, single config in `packages/config`, shared by
  every app — no per-app overrides. Single quotes, semicolons, trailing
  commas (`all`), 80-column print width.
- **Linting**: ESLint + `typescript-eslint`, shared config in
  `packages/config`. Two rules specific to this platform's architecture,
  beyond standard recommended sets:
  - `eslint-plugin-boundaries` (or an equivalent custom rule) enforcing
    the Clean Architecture dependency direction from
    [01-ARCHITECTURE.md §2](01-ARCHITECTURE.md#2-backend-clean-architecture-in-nestjs) —
    a `domain/` file importing from `infrastructure/` or a Nest decorator
    fails lint, not just code review.
  - Import ordering (external → internal absolute → relative), auto-fixed,
    so diffs never contain noise import-reordering.
- **TypeScript**: `strict: true` everywhere, no exceptions per-file
  (`@ts-ignore` requires an inline comment explaining why, reviewed like
  any other suppression).

## 5. Testing Strategy

| Layer | Tool | What's covered | Target |
|---|---|---|---|
| Domain / Application (backend) | Jest | Business rules in isolation — no DB, no HTTP (e.g. `OrderStatusTransitionValidator`, `CouponValidationService`, `PricingService`) | 80%+ — this is the highest-value test coverage on the platform, since it's pure business logic that will be reused across every future client deployment |
| Infrastructure (backend) | Jest + a real test Postgres instance | Repository implementations against actual Prisma queries — catches ORM/schema mismatches unit tests can't | Critical paths (stock reservation, order creation) covered; not exhaustive |
| Interface / e2e (backend) | Jest + Supertest | Full HTTP round-trip for critical flows: auth, checkout, RBAC boundary enforcement | Every flow in [05-ROADMAP.md](05-ROADMAP.md) exit criteria has at least one e2e test |
| Frontend components | React Testing Library | Interactive components with real logic (`VariantPicker`, `CouponInput`, forms) — not every presentational component | Judgment call per component; skip trivial ones |
| Frontend e2e | Playwright (or equivalent) | The few flows where a real browser matters: checkout end-to-end, login | A small, fast suite — not a substitute for the backend e2e coverage above |

Domain-layer coverage is called out as the priority deliberately: a bug in
`CheckoutOrchestrator` or `StockReservationService` is a bug in every
future client's deployment simultaneously, which is exactly the leverage
(good and bad) of building a reusable platform rather than one-off code.

## 6. Documentation Rules

- Every backend module gets a short `README.md` (2-3 paragraphs: what
  context it owns, what it depends on, anything genuinely non-obvious) —
  not a restatement of this planning doc, a pointer to it plus module-
  specific notes.
- **Architecture Decision Records** (ADRs) in `docs/adr/NNNN-title.md` for
  any decision that reverses or meaningfully narrows something in this
  planning set (e.g. "we chose cursor pagination for X after all," "we
  introduced Redis earlier than planned because Y") — a short, dated,
  append-only log of *why*, so a future contributor (or a future client's
  team forking this platform) doesn't have to reverse-engineer intent from
  a diff.
- This documents set (`docs/01`–`15`) is a **living reference**, not a
  one-time deliverable — a feature that changes an API shape, a schema
  field, or an RBAC rule updates the relevant doc in the same PR. A doc
  that silently drifts from the code stops being trusted, which defeats
  the point of having it.

## 7. Review Checklist

Every PR is checked against, at minimum:

- [ ] Tests added/updated for the change; domain-layer changes have
      domain-layer tests (not just an e2e test standing in for one).
- [ ] No `domain/` import from `infrastructure/` or a framework package
      (lint-enforced, but reviewed anyway — lint catches the mechanical
      case, not every architectural smell).
- [ ] New/changed Prisma models reviewed against
      [07-DATABASE-REVIEW.md](07-DATABASE-REVIEW.md)'s checklist
      (indexes, cascade policy — especially: does this introduce a hard
      delete on something `Order`/`AuditLog` might reference?).
- [ ] New endpoints reviewed against the RBAC matrix
      ([05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix)) and carry
      the correct `@Roles()`/`@Permissions()` guard — an endpoint with no
      explicit guard is a bug, not a default-allow.
- [ ] New error cases use a registered error code
      ([08-API-REVIEW.md §7](08-API-REVIEW.md#7-error-format)), not an
      ad hoc string.
- [ ] New content-editable fields (product description, page body, etc.)
      confirmed sanitized server-side if they accept rich text.
- [ ] New storefront content types have `metaTitle`/`metaDescription`
      fields and are wired into the shared SEO helper
      ([11-STOREFRONT-SPEC.md](11-STOREFRONT-SPEC.md#cross-cutting-notes)).
- [ ] Any client-specific value (copy, branding, config) is
      environment/data-driven, not hardcoded — the reusability check.
- [ ] Relevant planning doc updated if this PR changes an API shape,
      schema field, or architectural decision (§6 above).
