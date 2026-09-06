# Epic 3A — Lessons Learned

## 1. A real, disclosed gap found in Epic 2: `AdminUser.email` isn't store-scoped

[ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md)'s decision table
explicitly lists `AdminUser`: `email @unique` → `(storeId, email)`. Epic
2 shipped `AdminUser.email String @unique` — a plain global unique,
never widened to `(storeId, email)`, and this wasn't disclosed as a
deviation at the time.

This epic did **not** fix it. Per the brief ("do not modify previous
Epics except for bug fixes") and in the interest of not silently
expanding this epic's blast radius into a frozen epic's schema, tests,
and seed data without being asked, the gap is reported here instead.
Fixing it properly means: adding `storeId` to `admin_users`, backfilling
the one seeded bootstrap Super Admin, widening the unique constraint,
and updating Epic 2's entity/mapper/repository/tests — a small but
real, self-contained migration that deserves its own short, deliberate
pass rather than being folded silently into Commerce Core's diff.
**Recommendation: a dedicated bug-fix pass on Identity, scoped to
exactly this, before Login/JWT lands** (widening a unique constraint
after real customer/admin data exists is exactly the expensive-migration
scenario ADR 0006 was written to avoid, and Login/JWT is the next thing
that will make `AdminUser` rows non-trivial to migrate).

## 2. v1's schema sketches are a starting point, not a spec to preserve

`docs/03-DATABASE-SCHEMA.md` sketched `Product.price`/`discountPrice` as
`@db.Money` — Postgres' native `money` type, which is locale/formatting-
dependent and a known footgun for application-level currency arithmetic
(rounding behavior differs from a plain `numeric`, and it silently
formats using the database's locale rather than staying a portable raw
number). This epic used `@db.Decimal(12, 2)` instead, without writing a
new ADR — deliberately, because this is an implementation-correctness
fix (the same category as Epic 2 choosing Argon2id over v1's implied
default), not a business-rule or schema-*shape* reversal that would need
one. **Lesson for future epics: treat every v1 sketch as "probably
directionally right, verify the concrete types before shipping," not as
a contract to preserve for its own sake** — the senior-review pass
already established this project doesn't treat v1 as gospel; this epic
is a small, concrete instance of that principle actually paying off (the
Money round-trip integration test would have caught real precision loss
had `@db.Money` been used).

## 3. Domain services that need repository data can stay pure via an injected loader

`CategoryHierarchyPolicy` needs a category's full ancestor chain to
validate depth/cycles, which only a repository can load. Rather than
either (a) importing a concrete repository into the domain layer
(breaking the dependency direction) or (b) moving all the validation
logic into the use-case (making the depth/cycle rules untestable without
a mocked NestJS provider), it accepts a `findById`-shaped function as a
parameter at call time. The use-case supplies the real repository call;
tests supply a plain in-memory map. **This is a reusable pattern for any
future domain concern that's logically pure but needs to walk a graph or
tree that only a repository can load** — CMS page hierarchies and any
future nested-comment/reply structure are likely candidates.

## 4. Concrete (non-interface) cross-cutting services are harder to unit-test than ports

Every domain repository (`ProductRepository`, `CategoryRepository`,
etc.) is a TypeScript `interface` — mocking one in a test is a plain
object literal typed `jest.Mocked<TheInterface>`, no friction. `StoreContext`
is a genuine NestJS `@Injectable()` **class** (correctly so — it's an
infrastructure concern, not a domain port to be swapped), and TypeScript
classes are structurally compared *including private members*, so a
plain mock object doesn't satisfy the type the way it does for an
interface. Every use-case test in this epic works around this with
`{ getCurrentStoreId: jest.fn(), ... } as unknown as StoreContext`. This
is a standard, accepted TypeScript testing pattern — not a defect — but
it's worth naming so a future contributor doesn't try to "fix" it by
turning `StoreContext` into an interface (which would be the wrong fix:
it's correctly a concrete service, not a swappable port).

## 5. Unit tests with mocked repositories cannot catch serialization bugs — integration tests still earn their keep

Every domain-layer unit test in this epic passed on the first run,
including all the `Money` arithmetic tests — because those tests never
touch a real Postgres `Decimal` column. The integration test that
actually writes `45000.50` / `39000.25` through
`PrismaProductRepository.create()` and reads them back is the only test
in this epic that could have caught a real round-trip precision bug (had
one existed). **Lesson reinforced, not new: the two test suites are not
redundant with each other** — this is the concrete case, this epic, where
that would have mattered.

## 6. Naming drift between architecture docs and epic briefs is worth catching, not silently reconciling

`docs/06-DDD-BOUNDED-CONTEXTS.md` names the slug-generation domain
service `SlugGenerator`; this epic's brief calls the same scope item
"Slug Service." The code is named `Slug` (the value object) with
`Slug.fromName()`/`Slug.fromRaw()` static factories rather than a
separate `SlugService`/`SlugGenerator` class, since generation and
validation are naturally the value object's own responsibility (matching
how `Email.create()` worked in Epic 2) — no separate service class was
needed once the VO owned its own construction rules. This is disclosed
here rather than silently picking one name and hoping nobody notices the
mismatch: **future epic briefs should either reuse the exact vocabulary
already established in docs/06, or explicitly say "this scope item maps
to docs/06's X" so the mapping is traceable instead of inferred.**

## 7. An open question surfaced for the next epic that touches Catalog

Should `Product`/`Category`/`Brand`/`Collection`/`Tag` eventually carry
`createdBy`/`updatedBy` actor attribution the way `AdminUser` does
(per [ADR 0005](../v2/adr/0005-actor-reference-model.md))? Not required
by this epic's brief, and there's no real "current actor" to stamp with
until Login/JWT exists anyway — but it's a natural, cheap addition
(exactly the same shape Epic 2 already built) once that epic lands, and
`docs/12-SECURITY-REVIEW.md`'s audit-trail expectations will likely want
it for the catalog eventually. Flagged here rather than decided.
